"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Code, Server, Key, X, Play, Copy, Check, ChevronRight, ChevronLeft, Command, Gem, FileCode, Box, Coffee, Cog, Cpu, Monitor, Search } from "lucide-react";

interface ParameterDoc {
    name: string;
    type: string;
    required: boolean;
    description: string;
}

interface ResponseDoc {
    name: string;
    response: string;
}

interface ApiDoc {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    method: string;
    parameters: string;
    exampleResponse?: string;
    exampleResponses?: ResponseDoc[];
    parameterDetails?: ParameterDoc[];
}

const LANGUAGES = ['cURL', 'Ruby', 'Python', 'JavaScript', 'Go', 'PHP', 'Java', 'Rust', 'C++', '.NET'] as const;
type Language = typeof LANGUAGES[number];

const LanguageIcons: Record<Language, React.ReactNode> = {
    cURL: <img src="/icons/curl.svg" alt="cURL" className="w-5 h-5 object-contain" />,
    Ruby: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" alt="Ruby" className="w-5 h-5 object-contain" />,
    Python: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className="w-5 h-5 object-contain" />,
    JavaScript: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className="w-5 h-5 object-contain" />,
    Go: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" alt="Go" className="w-5 h-5 object-contain" />,
    PHP: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className="w-5 h-5 object-contain" />,
    Java: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className="w-5 h-5 object-contain" />,
    Rust: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg" alt="Rust" className="w-5 h-5 object-contain dark:invert" />,
    "C++": <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className="w-5 h-5 object-contain" />,
    ".NET": <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dotnetcore/dotnetcore-original.svg" alt=".NET" className="w-5 h-5 object-contain" />,
};

const syntaxHighlight = (code: string) => {
    if (!code) return "";
    let html = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/(["'`])(.*?)\1/g, '<span class="text-green-600 dark:text-green-400">$&</span>')
        .replace(/\b(import|from|require|package|func|var|let|const|if|else|struct|public|new|await|async|def|return)\b/g, '<span class="text-purple-600 dark:text-purple-400 font-bold">$&</span>')
        .replace(/\b(GET|POST|PUT|DELETE)\b/g, '<span class="text-yellow-600 dark:text-yellow-400 font-bold">$&</span>')
        .replace(/\b(true|false|null|nil)\b/g, '<span class="text-orange-600 dark:text-orange-400">$&</span>')
        .replace(/\b([A-Za-z_][A-Za-z0-9_]*)(?=\()/g, '<span class="text-blue-600 dark:text-blue-400">$&</span>');
    return html;
};

export default function Docs() {
    const [docs, setDocs] = useState<ApiDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [codePanelDoc, setCodePanelDoc] = useState<string | null>(null);
    const [selectedLang, setSelectedLang] = useState<Language>('cURL');
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState("https://api.flightagent.dev");
    const tabsRef = useRef<HTMLDivElement>(null);
    const [activeDoc, setActiveDoc] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let currentBaseUrl = "https://api.flightagent.dev";
        if (typeof window !== 'undefined') {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                currentBaseUrl = "http://localhost:8080";
                setBaseUrl(currentBaseUrl);
            }
        }

        const controller = new AbortController();
        const signal = controller.signal;

        fetch(`${currentBaseUrl}/api/apipulse/docs`, { signal })
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setDocs(data);
                } else {
                    throw new Error("Data is not an array");
                }
                setLoading(false);
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.warn("Failed to fetch docs:", err);
                setDocs([{
                    id: "flight-search",
                    name: "Flight Search API",
                    description: "Search for real-time flight data across multiple airlines.",
                    endpoint: "/api/apipulse/flights/search",
                    method: "GET",
                    parameters: "?origin=DEL&destination=BOM&date=2026-09-24&adults=1&cabinClass=ECONOMY",
                    exampleResponse: "[\n  { \"status\": \"Fallback data due to fetch error\" }\n]",
                    parameterDetails: [
                        { name: "origin", type: "String", required: true, description: "3-letter IATA code" }
                    ]
                }]);
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const headings = Array.from(document.querySelectorAll('.scroll-mt-24'));
            let current = "";
            for (let i = headings.length - 1; i >= 0; i--) {
                const heading = headings[i];
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 200) {
                    current = heading.id;
                    break;
                }
            }
            if (current) setActiveDoc(current);
        };

        window.addEventListener('scroll', handleScroll);
        setTimeout(handleScroll, 500);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [docs]);

    const generateCode = (doc: ApiDoc, lang: Language) => {
        const isMultipart = doc.parameterDetails?.some(p => p.type === 'File');
        const urlParams = (isMultipart || (doc.parameters && doc.parameters.includes('Multipart'))) ? "" : (doc.parameters || "");
        const fullUrl = `${baseUrl}${doc.endpoint}${urlParams}`;
        
        if (isMultipart) {
            switch (lang) {
                case 'cURL': {
                    let flags = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `  -F "${p.name}=@/path/to/image.jpg;type=image/jpeg"`;
                        return `  -F "${p.name}=value"`;
                    }).join(" \\\n") || "";
                    return `curl -X ${doc.method} "${fullUrl}" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n${flags}`;
                }
                case 'Python': {
                    let filesDict = doc.parameterDetails?.filter(p => p.type === 'File').map(p => `"${p.name}": ("image.jpg", open("/path/to/image.jpg", "rb"), "image/jpeg")`).join(", ");
                    let dataDict = doc.parameterDetails?.filter(p => p.type !== 'File').map(p => `"${p.name}": "value"`).join(", ");
                    let dataArg = dataDict ? `, data={${dataDict}}` : "";
                    return `import requests\n\nurl = "${fullUrl}"\nheaders = {"Authorization": "Bearer YOUR_API_KEY"}\nfiles = {${filesDict}}\n\nresponse = requests.post(url, headers=headers, files=files${dataArg})\nprint(response.json())`;
                }
                case 'JavaScript': {
                    let fdAppends = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `// Browser automatically sets the correct MIME type (e.g., image/jpeg) from the File object\nformData.append("${p.name}", fileInput.files[0]);`;
                        return `formData.append("${p.name}", "value");`;
                    }).join("\n") || "";
                    return `const formData = new FormData();\n${fdAppends}\n\nfetch("${fullUrl}", {\n  method: "${doc.method}",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY"\n  },\n  body: formData\n})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
                }
                case 'Ruby': {
                    let fdArgs = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `['${p.name}', File.open('/path/to/image.jpg'), {filename: 'image.jpg', content_type: 'image/jpeg'}]`;
                        return `['${p.name}', 'value']`;
                    }).join(", ") || "";
                    return `require 'uri'\nrequire 'net/http'\n\nurl = URI("${fullUrl}")\nhttp = Net::HTTP.new(url.host, url.port)\nhttp.use_ssl = true\n\nrequest = Net::HTTP::Post.new(url)\nrequest["Authorization"] = "Bearer YOUR_API_KEY"\nrequest.set_form([${fdArgs}], 'multipart/form-data')\n\nresponse = http.request(request)\nputs response.read_body`;
                }
                case 'Go': {
                    let fdFields = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `  h := make(textproto.MIMEHeader)\n  h.Set("Content-Disposition", \`form-data; name="${p.name}"; filename="image.jpg"\`)\n  h.Set("Content-Type", "image/jpeg")\n  fileWriter, _ := writer.CreatePart(h)\n  file, _ := os.Open("/path/to/image.jpg")\n  io.Copy(fileWriter, file)\n  file.Close()`;
                        return `  writer.WriteField("${p.name}", "value")`;
                    }).join("\n") || "";
                    return `package main\n\nimport (\n  "fmt"\n  "net/http"\n  "net/textproto"\n  "io/ioutil"\n  "bytes"\n  "mime/multipart"\n  "os"\n  "io"\n)\n\nfunc main() {\n  payload := &bytes.Buffer{}\n  writer := multipart.NewWriter(payload)\n${fdFields}\n  writer.Close()\n\n  req, _ := http.NewRequest("${doc.method}", "${fullUrl}", payload)\n  req.Header.Add("Authorization", "Bearer YOUR_API_KEY")\n  req.Header.Set("Content-Type", writer.FormDataContentType())\n\n  res, _ := http.DefaultClient.Do(req)\n  defer res.Body.Close()\n  body, _ := ioutil.ReadAll(res.Body)\n  fmt.Println(string(body))\n}`;
                }
                case 'PHP': {
                    let phpFields = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `  '${p.name}' => new CURLFILE('/path/to/image.jpg', 'image/jpeg', 'image.jpg')`;
                        return `  '${p.name}' => 'value'`;
                    }).join(",\n") || "";
                    return `<?php\n$curl = curl_init();\ncurl_setopt_array($curl, [\n  CURLOPT_URL => "${fullUrl}",\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => "${doc.method}",\n  CURLOPT_POSTFIELDS => array(\n${phpFields}\n  ),\n  CURLOPT_HTTPHEADER => [\n    "Authorization: Bearer YOUR_API_KEY"\n  ],\n]);\n$response = curl_exec($curl);\n$err = curl_error($curl);\ncurl_close($curl);\nif ($err) {\n  echo "cURL Error #:" . $err;\n} else {\n  echo $response;\n}`;
                }
                case 'Java': {
                    return `// Ensure you have okhttp3 in your dependencies\nOkHttpClient client = new OkHttpClient().newBuilder().build();\nMultipartBody.Builder builder = new MultipartBody.Builder().setType(MultipartBody.FORM);\n` + 
                    (doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `builder.addFormDataPart("${p.name}", "image.jpg",\n  RequestBody.create(MediaType.parse("image/jpeg"), new File("/path/to/image.jpg")));`;
                        return `builder.addFormDataPart("${p.name}", "value");`;
                    }).join("\n") || "") + 
                    `\nRequestBody body = builder.build();\nRequest request = new Request.Builder()\n  .url("${fullUrl}")\n  .method("${doc.method}", body)\n  .addHeader("Authorization", "Bearer YOUR_API_KEY")\n  .build();\nResponse response = client.newCall(request).execute();\nSystem.out.println(response.body().string());`;
                }
                case 'Rust': {
                    let rustFields = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `  .part("${p.name}", reqwest::multipart::Part::file("/path/to/image.jpg").await?.mime_str("image/jpeg")?)`;
                        return `  .text("${p.name}", "value")`;
                    }).join("\n") || "";
                    return `let form = reqwest::multipart::Form::new()\n${rustFields};\n\nlet client = reqwest::Client::new();\nlet res = client.${doc.method.toLowerCase()}("${fullUrl}")\n    .header("Authorization", "Bearer YOUR_API_KEY")\n    .multipart(form)\n    .send()\n    .await?;\nprintln!("{}", res.text().await?);`;
                }
                case '.NET': {
                    let csFields = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `var fileContent = new StreamContent(File.OpenRead("/path/to/image.jpg"));\nfileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");\ncontent.Add(fileContent, "${p.name}", "image.jpg");`;
                        return `content.Add(new StringContent("value"), "${p.name}");`;
                    }).join("\n") || "";
                    return `var client = new HttpClient();\nvar request = new HttpRequestMessage(HttpMethod.${doc.method.charAt(0) + doc.method.slice(1).toLowerCase()}, "${fullUrl}");\nrequest.Headers.Add("Authorization", "Bearer YOUR_API_KEY");\nvar content = new MultipartFormDataContent();\n${csFields}\nrequest.Content = content;\nvar response = await client.SendAsync(request);\nresponse.EnsureSuccessStatusCode();\nConsole.WriteLine(await response.Content.ReadAsStringAsync());`;
                }
                case 'C++': {
                    let cppFields = doc.parameterDetails?.map(p => {
                        if (p.type === 'File') return `  field = curl_mime_addpart(form);\n  curl_mime_name(field, "${p.name}");\n  curl_mime_filedata(field, "/path/to/image.jpg");\n  curl_mime_type(field, "image/jpeg");`;
                        return `  field = curl_mime_addpart(form);\n  curl_mime_name(field, "${p.name}");\n  curl_mime_data(field, "value", CURL_ZERO_TERMINATED);`;
                    }).join("\n") || "";
                    return `CURL *curl;\nCURLcode res;\ncurl_mime *form = NULL;\ncurl_mimepart *field = NULL;\n\ncurl = curl_easy_init();\nif(curl) {\n  curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${doc.method}");\n  curl_easy_setopt(curl, CURLOPT_URL, "${fullUrl}");\n\n  form = curl_mime_init(curl);\n${cppFields}\n  curl_easy_setopt(curl, CURLOPT_MIMEPOST, form);\n\n  struct curl_slist *headers = NULL;\n  headers = curl_slist_append(headers, "Authorization: Bearer YOUR_API_KEY");\n  curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n\n  res = curl_easy_perform(curl);\n  curl_mime_free(form);\n  curl_easy_cleanup(curl);\n}`;
                }
                default:
                    return `// Multipart form-data upload for ${lang} requires a multipart library.\n// Send a POST request with 'multipart/form-data' containing:\n` + 
                    (doc.parameterDetails?.map(p => `// - ${p.name} (${p.type})`).join("\n") || "") +
                    `\n// to: ${fullUrl}\n// Ensure to pass: "Authorization: Bearer YOUR_API_KEY" in the header`;
            }
        }
        
        switch (lang) {
            case 'cURL':
                return `curl -X ${doc.method} "${fullUrl}" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;
            case 'Ruby':
                return `require 'uri'\nrequire 'net/http'\n\nurl = URI("${fullUrl}")\nhttp = Net::HTTP.new(url.host, url.port)\nhttp.use_ssl = true\n\nrequest = Net::HTTP::${doc.method.charAt(0).toUpperCase() + doc.method.slice(1).toLowerCase()}.new(url)\nrequest["Authorization"] = "Bearer YOUR_API_KEY"\n\nresponse = http.request(request)\nputs response.read_body`;
            case 'Python':
                return `import requests\n\nurl = "${fullUrl}"\nheaders = {"Authorization": "Bearer YOUR_API_KEY"}\n\nresponse = requests.${doc.method.toLowerCase()}(url, headers=headers)\nprint(response.json())`;
            case 'JavaScript':
                return `fetch("${fullUrl}", {\n  method: "${doc.method}",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY"\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
            case 'Go':
                return `package main\n\nimport (\n  "fmt"\n  "net/http"\n  "io/ioutil"\n)\n\nfunc main() {\n  req, _ := http.NewRequest("${doc.method}", "${fullUrl}", nil)\n  req.Header.Add("Authorization", "Bearer YOUR_API_KEY")\n  res, _ := http.DefaultClient.Do(req)\n  defer res.Body.Close()\n  body, _ := ioutil.ReadAll(res.Body)\n  fmt.Println(string(body))\n}`;
            case 'PHP':
                return `<?php\n$curl = curl_init();\ncurl_setopt_array($curl, [\n  CURLOPT_URL => "${fullUrl}",\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => "${doc.method}",\n  CURLOPT_HTTPHEADER => [\n    "Authorization: Bearer YOUR_API_KEY"\n  ],\n]);\n$response = curl_exec($curl);\n$err = curl_error($curl);\ncurl_close($curl);\nif ($err) {\n  echo "cURL Error #:" . $err;\n} else {\n  echo $response;\n}`;
            case 'Java':
                return `HttpRequest request = HttpRequest.newBuilder()\n    .uri(URI.create("${fullUrl}"))\n    .header("Authorization", "Bearer YOUR_API_KEY")\n    .method("${doc.method}", HttpRequest.BodyPublishers.noBody())\n    .build();\nHttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());\nSystem.out.println(response.body());`;
            case 'Rust':
                return `let client = reqwest::Client::new();\nlet res = client.${doc.method.toLowerCase()}("${fullUrl}")\n    .header("Authorization", "Bearer YOUR_API_KEY")\n    .send()\n    .await?;\nprintln!("{}", res.text().await?);`;
            case 'C++':
                return `CURL *curl;\nCURLcode res;\ncurl = curl_easy_init();\nif(curl) {\n  curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${doc.method}");\n  curl_easy_setopt(curl, CURLOPT_URL, "${fullUrl}");\n  struct curl_slist *headers = NULL;\n  headers = curl_slist_append(headers, "Authorization: Bearer YOUR_API_KEY");\n  curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n  res = curl_easy_perform(curl);\n}`;
            case '.NET':
                return `var client = new HttpClient();\nvar request = new HttpRequestMessage(HttpMethod.${doc.method.charAt(0) + doc.method.slice(1).toLowerCase()}, "${fullUrl}");\nrequest.Headers.Add("Authorization", "Bearer YOUR_API_KEY");\nvar response = await client.SendAsync(request);\nresponse.EnsureSuccessStatusCode();\nConsole.WriteLine(await response.Content.ReadAsStringAsync());`;
            default:
                return '';
        }
    };

    const handleCopy = (doc: ApiDoc) => {
        navigator.clipboard.writeText(generateCode(doc, selectedLang));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scrollTabs = (direction: 'left' | 'right') => {
        const currentIndex = LANGUAGES.indexOf(selectedLang);
        let newIndex = currentIndex;

        if (direction === 'left' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'right' && currentIndex < LANGUAGES.length - 1) {
            newIndex = currentIndex + 1;
        }

        if (newIndex !== currentIndex) {
            setSelectedLang(LANGUAGES[newIndex]);
            if (tabsRef.current) {
                const scrollAmount = 60;
                tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 md:sticky md:top-24 h-fit md:max-h-[calc(100vh-8rem)] flex flex-col gap-4 select-none">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> Endpoints</h3>
                    <div className="relative pr-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search APIs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div className="space-y-6 pr-4 overflow-y-auto scrollbar-hide pb-4">
                        {Object.entries(
                            docs.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase())).reduce((acc, doc) => {
                                let category = "Other APIs";
                                if (doc.endpoint.includes("/flights/")) category = "Flights";
                                else if (doc.endpoint.includes("/trains/")) category = "Trains";
                                else if (doc.endpoint.includes("/images/")) category = "Image Processing";
                                
                                if (!acc[category]) acc[category] = [];
                                acc[category].push(doc);
                                return acc;
                            }, {} as Record<string, ApiDoc[]>)
                        ).map(([category, categoryDocs]) => (
                            <div key={category}>
                                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 pl-2 border-l-2 border-gray-200 dark:border-gray-800">{category}</h4>
                                <ul className="space-y-1 pl-3">
                                    {categoryDocs.map(doc => (
                                        <li key={doc.id}>
                                            <a 
                                                href={`#${doc.id}`} 
                                                onClick={() => setActiveDoc(doc.id)}
                                                className={`transition-colors text-sm font-medium flex items-center px-2 py-1.5 rounded-lg ${activeDoc === doc.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5 dark:hover:text-gray-200 dark:hover:bg-white/5'}`}
                                            >
                                                {doc.name}
                                                {doc.id === 'train-pnr' && <span className="text-red-500 ml-1 font-bold" title="Still suss">*</span>}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-16 min-w-0 transition-all duration-300">
                    <div className="border-b pb-8 border-black/10 dark:border-white/10">
                        <h1 className="text-4xl font-extrabold mb-4">API Documentation</h1>
                        <p className="text-xl text-gray-500 mb-8">Explore the endpoints available in the ApiPulse network.</p>

                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><Key className="h-5 w-5 text-primary" /> Authentication</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">All API requests must be authenticated using a Bearer token. Include your API key in the Authorization header of your requests.</p>
                            <code className="text-sm bg-black/5 dark:bg-white/10 p-3 rounded-lg block font-mono">
                                Authorization: Bearer YOUR_API_KEY
                            </code>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6" id="errors">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Terminal className="h-5 w-5 text-red-500" /> Standard Errors</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">The API uses standard HTTP status codes to indicate the success or failure of an API request. All errors return a standardized JSON object.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div className="space-y-4 text-sm">
                                    <div className="flex gap-3 items-start"><span className="font-mono text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded font-bold">400</span><div><span className="font-bold text-red-500">VALIDATION_FAILED</span><br/><span className="text-gray-500">Invalid parameters provided.</span></div></div>
                                    <div className="flex gap-3 items-start"><span className="font-mono text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded font-bold">401</span><div><span className="font-bold text-red-500">UNAUTHORIZED</span><br/><span className="text-gray-500">Missing or invalid API key.</span></div></div>
                                    <div className="flex gap-3 items-start"><span className="font-mono text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded font-bold">402</span><div><span className="font-bold text-red-500">INSUFFICIENT_CREDITS</span><br/><span className="text-gray-500">Account has run out of credits.</span></div></div>
                                    <div className="flex gap-3 items-start"><span className="font-mono text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded font-bold">403</span><div><span className="font-bold text-red-500">KEY_EXPIRED</span><br/><span className="text-gray-500">The API key has expired.</span></div></div>
                                    <div className="flex gap-3 items-start"><span className="font-mono text-xs px-2 py-1 bg-black/5 dark:bg-white/10 rounded font-bold">500</span><div><span className="font-bold text-red-500">INTERNAL_ERROR</span><br/><span className="text-gray-500">Unexpected server error.</span></div></div>
                                </div>
                                <div className="bg-black/5 dark:bg-[#1e1e1e] p-4 rounded-xl border border-black/10 dark:border-white/10">
                                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Example Error Payload</span>
                                    <pre className="text-xs font-mono text-gray-800 dark:text-gray-300 overflow-x-auto">
{`{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid request parameters.",
    "status": 400,
    "details": [
      {
        "field": "origin",
        "issue": "Must be exactly 3 alphabetic characters (IATA code)"
      }
    ],
    "timestamp": "2026-09-15T16:00:00.000Z"
  }
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-8">
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
                            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
                        </div>
                    ) : (
                        docs.map(doc => (
                            <div key={doc.id} id={doc.id} className="scroll-mt-24">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold">{doc.name}</h2>
                                </div>
                                <p className="text-gray-500 mb-6">{doc.description}</p>

                                <div className="glass rounded-2xl overflow-hidden mb-6">
                                    <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-3 border-b border-black/10 dark:border-white/10">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${doc.method === 'GET' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                            {doc.method}
                                        </span>
                                        <code className="text-sm font-mono">{doc.endpoint}</code>
                                    </div>

                                    <div className="p-4 space-y-6 border border-black/10 dark:border-white/10">
                                        {/* Parameters Block */}
                                        <div>
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                                <Terminal className="h-4 w-4" /> Parameters
                                            </h4>
                                            {doc.parameterDetails && doc.parameterDetails.length > 0 ? (
                                                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                                            <tr>
                                                                <th className="px-4 py-3 font-medium">Name</th>
                                                                <th className="px-4 py-3 font-medium">Type</th>
                                                                <th className="px-4 py-3 font-medium">Required</th>
                                                                <th className="px-4 py-3 font-medium">Description</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                                            {doc.parameterDetails.map((param, idx) => (
                                                                <tr key={idx} className="bg-white/50 dark:bg-black/20">
                                                                    <td className="px-4 py-3 font-mono text-primary font-medium">{param.name}</td>
                                                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{param.type}</td>
                                                                    <td className="px-4 py-3">
                                                                        {param.required ?
                                                                            <span className="text-xs bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-1 rounded">Required</span> :
                                                                            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded">Optional</span>
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{param.description}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <code className="text-sm text-primary bg-primary/10 px-2 py-1 rounded">{doc.parameters}</code>
                                            )}
                                        </div>

                                        {/* Inline Code Generator Block */}

                                        <div className="bg-white dark:bg-[#1e1e1e] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg mt-4 animate-in fade-in slide-in-from-top-4 duration-300">

                                            {/* Language Tabs Row */}
                                            <div className="flex items-center bg-[#f3f4f6] dark:bg-[#2d2d2d] border-b border-black/10 dark:border-white/10">
                                                <button onClick={() => scrollTabs('left')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-500 shrink-0">
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>

                                                <div
                                                    ref={tabsRef}
                                                    className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-1 p-1"
                                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                >
                                                    {LANGUAGES.map(lang => {
                                                        const iconNode = LanguageIcons[lang];
                                                        return (
                                                            <button
                                                                key={lang}
                                                                onClick={() => setSelectedLang(lang)}
                                                                title={lang}
                                                                className={`p-2.5 rounded-md transition-colors cursor-pointer shrink-0 ${selectedLang === lang ? 'bg-white dark:bg-[#1e1e1e] shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                            >
                                                                {iconNode}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <button onClick={() => scrollTabs('right')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-500 shrink-0">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Code Display */}
                                            <div className="relative group p-4">
                                                <pre
                                                    className="overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-300"
                                                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(generateCode(doc, selectedLang)) }}
                                                />
                                                <button
                                                    onClick={() => handleCopy(doc)}
                                                    className="absolute top-2 right-2 p-2 bg-white dark:bg-[#2d2d2d] border border-black/10 dark:border-white/10 rounded-lg shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#3d3d3d] cursor-pointer"
                                                >
                                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                </button>
                                            </div>

                                            <div className="bg-[#f9fafb] dark:bg-[#252526] px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-black/10 dark:border-white/10">
                                                Base URL automatically resolves to <code className="font-mono text-primary">{baseUrl}</code>
                                            </div>
                                        </div>

                                        {/* Response Block */}
                                        <div>
                                            {doc.exampleResponses && doc.exampleResponses.length > 0 ? (
                                                <div className="space-y-4">
                                                    {doc.exampleResponses.map((res, idx) => (
                                                        <div key={idx}>
                                                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                                                                <Code className="h-4 w-4" /> {res.name}
                                                            </h4>
                                                            <pre className="bg-black/5 dark:!bg-white/10 p-4 rounded-xl overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200">
                                                                {res.response}
                                                            </pre>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : doc.exampleResponse ? (
                                                <div>
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                                                        <Code className="h-4 w-4" /> Response
                                                    </h4>
                                                    <pre className="bg-black/5 dark:!bg-white/10 p-4 rounded-xl overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200">
                                                        {doc.exampleResponse}
                                                    </pre>
                                                </div>
                                            ) : null}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
        </div>
    );
}
