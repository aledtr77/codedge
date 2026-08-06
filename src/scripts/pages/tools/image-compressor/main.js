import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import '@/styles/pages/tools/image-compressor/index.css';

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/button.js";
import "@/scripts/components/footer.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("fileInput") || document.getElementById("uploadArea")) {
    const { initImageCompressor } = await import("@/scripts/pages/tools/image-compressor/image-compressor.js");
    initImageCompressor();
  }
});
