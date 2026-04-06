import "@/styles/components/main.css";
import "@/styles/components/navbar.css";
import "@/styles/components/footer.css";
import "@/styles/components/card.css";
import "@/styles/components/button.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import '@/styles/pages/shop-template/index.css';

import etsyListingsWebp from "@/assets/images/shop-template/etsy-listings.webp";
import etsyListingsJpg from "@/assets/images/shop-template/etsy-listings.jpg";
import powermaxGymPromoWebp from "@/assets/images/shop-template/powermax-gym-promo.webp";
import powermaxGymPromoJpg from "@/assets/images/shop-template/powermax-gym-promo.jpg";
import mindAndMotionPromoWebp from "@/assets/images/shop-template/mind-and-motion-promo.webp";
import mindAndMotionPromoJpg from "@/assets/images/shop-template/mind-and-motion-promo.jpg";
import customWebsiteTemplateWebp from "@/assets/images/shop-template/custom-website-template.webp";
import customWebsiteTemplateJpg from "@/assets/images/shop-template/custom-website-template.jpg";
import fitnessCoachTemplateWebp from "@/assets/images/shop-template/fitness-coach-template.webp";
import fitnessCoachTemplateJpg from "@/assets/images/shop-template/fitness-coach-template.jpg";

import "@/scripts/components/navbar.js";
import "@/scripts/components/navbar-loader.js";
import "@/scripts/components/footer.js";

const shopTemplateAssets = {
  etsyListingsWebp,
  etsyListingsJpg,
  powermaxGymPromoWebp,
  powermaxGymPromoJpg,
  mindAndMotionPromoWebp,
  mindAndMotionPromoJpg,
  customWebsiteTemplateWebp,
  customWebsiteTemplateJpg,
  fitnessCoachTemplateWebp,
  fitnessCoachTemplateJpg
};

document.querySelectorAll("[data-asset]").forEach((el) => {
  const key = el.getAttribute("data-asset");
  const value = key ? shopTemplateAssets[key] : null;
  if (!value) return;

  if (el.tagName === "SOURCE") {
    el.setAttribute("srcset", value);
    return;
  }

  el.setAttribute("src", value);
});
