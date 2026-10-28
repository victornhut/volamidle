using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Collections.Generic;

namespace VolamIdleServer {
    class Program {
        private static string BaseDir;
        private static int Port = 8080;
        private static readonly HttpClientHandler HttpHandler = new HttpClientHandler {
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        };
        private static readonly HttpClient RemoteClient = new HttpClient(HttpHandler) {
            Timeout = TimeSpan.FromSeconds(15)
        };
        private static readonly string RemoteOrigin = "https://volamidle.pages.dev";
        private static readonly string SupabaseOrigin = "https://bzgxytkuwqvshbnkazyv.supabase.co";

        private static readonly Dictionary<string, string> MimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
            { ".html", "text/html; charset=utf-8" },
            { ".htm", "text/html; charset=utf-8" },
            { ".js", "application/javascript; charset=utf-8" },
            { ".css", "text/css; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".webp", "image/webp" },
            { ".gif", "image/gif" },
            { ".svg", "image/svg+xml" },
            { ".ico", "image/x-icon" },
            { ".mp3", "audio/mpeg" },
            { ".wav", "audio/wav" },
            { ".ogg", "audio/ogg" },
            { ".woff2", "font/woff2" },
            { ".woff", "font/woff" },
            { ".ttf", "font/ttf" },
            { ".txt", "text/plain; charset=utf-8" },
            { ".sql", "text/plain; charset=utf-8" }
        };

        static void Main(string[] args) {
            Console.OutputEncoding = Encoding.UTF8;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;
            ServicePointManager.DefaultConnectionLimit = 64;

            BaseDir = AppDomain.CurrentDomain.BaseDirectory;

            if (args.Length > 0) {
                int customPort;
                if (int.TryParse(args[0], out customPort)) {
                    Port = customPort;
                }
            }

            HttpListener listener = null;
            while (Port < 8100) {
                try {
                    listener = new HttpListener();
                    listener.Prefixes.Add("http://localhost:" + Port + "/");
                    listener.Prefixes.Add("http://127.0.0.1:" + Port + "/");
                    listener.Start();
                    break;
                } catch (Exception) {
                    listener.Close();
                    Port++;
                }
            }

            if (listener == null || !listener.IsListening) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Lỗi: Không thể khởi chạy HttpListener trên các port 8080-8100.");
                Console.ResetColor();
                return;
            }

            string appUrl = "http://localhost:" + Port + "/";
            Console.Title = "Võ Lâm Idle - Local Server [Port " + Port + "]";
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("==================================================================");
            Console.WriteLine("              VÕ LÂM IDLE - MÁY CHỦ LOCALHOST                     ");
            Console.WriteLine("==================================================================");
            Console.ResetColor();
            Console.WriteLine(" Thư mục game : " + BaseDir);
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(" Địa chỉ chơi : " + appUrl);
            Console.ResetColor();
            Console.WriteLine(" Kết nối API  : Supabase Cloud (Đầy đủ Login/Cloud Save/KNB/Chợ)");
            Console.WriteLine(" Chế độ cache : Toàn bộ 11,000+ tài nguyên hình ảnh/âm thanh Offline");
            Console.WriteLine("------------------------------------------------------------------");
            Console.WriteLine(" Đang mở trình duyệt web... Nhấn Ctrl+C để dừng máy chủ bất kỳ lúc nào.");
            Console.WriteLine("==================================================================\n");

            try {
                Process.Start(new ProcessStartInfo(appUrl) { UseShellExecute = true });
            } catch { }

            Task.Run(() => ListenLoop(listener));

            var exitEvent = new ManualResetEvent(false);
            Console.CancelKeyPress += (sender, eventArgs) => {
                eventArgs.Cancel = true;
                exitEvent.Set();
            };
            exitEvent.WaitOne();

            listener.Stop();
            Console.WriteLine("\nĐã dừng máy chủ.");
        }

        private static async void ListenLoop(HttpListener listener) {
            while (listener.IsListening) {
                try {
                    var context = await listener.GetContextAsync();
                    ThreadPool.QueueUserWorkItem(async _ => await HandleRequest(context));
                } catch {
                    if (!listener.IsListening) break;
                }
            }
        }

        private static async Task HandleRequest(HttpListenerContext context) {
            HttpListenerRequest req = context.Request;
            HttpListenerResponse resp = context.Response;

            resp.Headers.Add("Access-Control-Allow-Origin", "*");
            resp.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
            resp.Headers.Add("Access-Control-Allow-Headers", "*");

            if (req.HttpMethod.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase)) {
                resp.StatusCode = 200;
                resp.Close();
                return;
            }

            string rawPath = req.Url.AbsolutePath;

            try {
                // 1. Supabase proxy support: /sb/... -> https://bzgxytkuwqvshbnkazyv.supabase.co/...
                if (rawPath.StartsWith("/sb/", StringComparison.OrdinalIgnoreCase) || rawPath.Equals("/sb", StringComparison.OrdinalIgnoreCase)) {
                    await ProxySupabase(context);
                    return;
                }

                // 2. Normalize static local file path
                string decodedPath = Uri.UnescapeDataString(rawPath).TrimStart('/');
                if (string.IsNullOrEmpty(decodedPath) || decodedPath.Equals("index.html", StringComparison.OrdinalIgnoreCase)) {
                    decodedPath = "index.html";
                }

                string localFilePath = Path.Combine(BaseDir, decodedPath.Replace('/', Path.DirectorySeparatorChar));

                if (File.Exists(localFilePath)) {
                    await ServeFile(resp, localFilePath);
                    return;
                }

                // 3. Fallback on-the-fly fetch for un-downloaded assets
                string remoteUrl = RemoteOrigin + "/" + decodedPath;
                try {
                    using (var remoteResp = await RemoteClient.GetAsync(remoteUrl)) {
                        if (remoteResp.IsSuccessStatusCode) {
                            byte[] data = await remoteResp.Content.ReadAsByteArrayAsync();
                            // Check if SPA fallback HTML
                            if (!(data.Length > 4 && data[0] == 60 && data[1] == 33)) {
                                string dir = Path.GetDirectoryName(localFilePath);
                                if (!Directory.Exists(dir)) {
                                    Directory.CreateDirectory(dir);
                                }
                                File.WriteAllBytes(localFilePath, data);
                                Console.ForegroundColor = ConsoleColor.Yellow;
                                Console.WriteLine("[Tải bổ sung & lưu cache] " + decodedPath);
                                Console.ResetColor();

                                await ServeFile(resp, localFilePath);
                                return;
                            }
                        }
                    }
                } catch { }

                // 4. Default 404
                resp.StatusCode = 404;
                byte[] notFound = Encoding.UTF8.GetBytes("File not found: " + decodedPath);
                resp.ContentType = "text/plain; charset=utf-8";
                resp.OutputStream.Write(notFound, 0, notFound.Length);
                resp.Close();
            } catch (Exception ex) {
                try {
                    resp.StatusCode = 500;
                    byte[] err = Encoding.UTF8.GetBytes("Server Error: " + (ex.InnerException != null ? ex.InnerException.Message : ex.Message));
                    resp.OutputStream.Write(err, 0, err.Length);
                    resp.Close();
                } catch { }
            }
        }

        private static async Task ServeFile(HttpListenerResponse resp, string filePath) {
            string ext = Path.GetExtension(filePath);
            string mime;
            if (!MimeTypes.TryGetValue(ext, out mime)) {
                mime = "application/octet-stream";
            }

            resp.ContentType = mime;
            if (ext.Equals(".html", StringComparison.OrdinalIgnoreCase) || Path.GetFileName(filePath).Equals("devtool.js", StringComparison.OrdinalIgnoreCase)) {
                resp.Headers.Add("Cache-Control", "no-cache");
            } else {
                resp.Headers.Add("Cache-Control", "public, max-age=31536000, immutable");
            }

            using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read)) {
                resp.ContentLength64 = fs.Length;
                await fs.CopyToAsync(resp.OutputStream);
            }
            resp.Close();
        }

        private static async Task ProxySupabase(HttpListenerContext context) {
            HttpListenerRequest req = context.Request;
            HttpListenerResponse resp = context.Response;

            string subPath = req.Url.PathAndQuery;
            if (subPath.StartsWith("/sb", StringComparison.OrdinalIgnoreCase)) {
                subPath = subPath.Substring(3);
                if (!subPath.StartsWith("/")) subPath = "/" + subPath;
            }

            string targetUrl = SupabaseOrigin + subPath;
            HttpRequestMessage proxyReq = new HttpRequestMessage(new HttpMethod(req.HttpMethod), targetUrl);

            foreach (string headerName in req.Headers.AllKeys) {
                if (headerName.Equals("Host", StringComparison.OrdinalIgnoreCase) ||
                    headerName.Equals("Origin", StringComparison.OrdinalIgnoreCase) ||
                    headerName.Equals("Referer", StringComparison.OrdinalIgnoreCase) ||
                    headerName.Equals("Connection", StringComparison.OrdinalIgnoreCase) ||
                    headerName.Equals("Content-Length", StringComparison.OrdinalIgnoreCase) ||
                    headerName.Equals("Content-Type", StringComparison.OrdinalIgnoreCase)) {
                    continue;
                }
                proxyReq.Headers.TryAddWithoutValidation(headerName, req.Headers.GetValues(headerName));
            }

            if (req.HasEntityBody) {
                using (MemoryStream ms = new MemoryStream()) {
                    req.InputStream.CopyTo(ms);
                    byte[] bodyBytes = ms.ToArray();
                    proxyReq.Content = new ByteArrayContent(bodyBytes);
                    if (!string.IsNullOrEmpty(req.ContentType)) {
                        proxyReq.Content.Headers.TryAddWithoutValidation("Content-Type", req.ContentType);
                    }
                }
            }

            using (HttpResponseMessage proxyResp = await RemoteClient.SendAsync(proxyReq)) {
                resp.StatusCode = (int)proxyResp.StatusCode;

                if (proxyResp.Content.Headers.ContentType != null) {
                    resp.ContentType = proxyResp.Content.Headers.ContentType.ToString();
                }

                byte[] respBytes = await proxyResp.Content.ReadAsByteArrayAsync();
                resp.ContentLength64 = respBytes.Length;
                await resp.OutputStream.WriteAsync(respBytes, 0, respBytes.Length);
                resp.Close();
            }
        }
    }
}
