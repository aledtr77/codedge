import codedgeLogo from "@/assets/icons/codedge-logo.svg";
import codedgeLogoCompact from "@/assets/icons/codedge-logo-minimal.svg";

const logoMap = {
  full: codedgeLogo,
  compact: codedgeLogoCompact
};

document.querySelectorAll("img[data-logo]").forEach((img) => {
  const key = img.dataset.logo;
  const nextSrc = key ? logoMap[key] : null;
  if (!nextSrc) return;

  img.src = nextSrc;
});
