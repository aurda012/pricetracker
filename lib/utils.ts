import { PriceHistoryItem, Product } from "@/types";

const Notification = {
  WELCOME: "WELCOME",
  CHANGE_OF_STOCK: "CHANGE_OF_STOCK",
  LOWEST_PRICE: "LOWEST_PRICE",
  THRESHOLD_MET: "THRESHOLD_MET",
};

const THRESHOLD_PERCENTAGE = 40;

export function returnDescription(prod: any) {
  if (prod.small_description) {
    return prod.small_description;
  } else if (prod.feature_bullets) {
    return prod.feature_bullets.join(" ");
  } else if (prod.full_description) {
    return prod.full_description;
  } else {
    return "";
  }
}

export function formatNumberString(number: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
  }).format(number);

  return formatted;
}

export function getDiscount(curPrice: string, oriPrice: string) {
  const currentPrice = formatPricing(curPrice);
  const originalPrice = formatPricing(oriPrice);
  const disc = ((originalPrice - currentPrice) / originalPrice) * 100;
  return Math.round(disc);
}

export function formatPricing(price: string) {
  let formattedPrice = price.replace("$", "").replace(",", "");
  return Number(formattedPrice);
}

export function getCurrencyFromPrice(price: string) {
  const regex = /[^0-9.,]+/; // match any non-digits and dots
  const match = price.match(regex);
  const currency = match ? match[0] : null; // get the first found currency symbol
  return currency;
}

export function extractValueFromAmazonURL(url: string) {
  // // Extract the path from the URL
  // const urlParts = url.split("/");
  // const path = urlParts[urlParts.length - 1];

  // // Find the position of the product ID
  // const idIndex = path.indexOf("/dp/") + 1;

  // // Extract the product ID
  // const productId = path.substring(idIndex, idIndex + 10); // Assuming product ID is 10 characters long

  // return productId;

  const urlArray = url.split("/dp/");
  const asinSide = urlArray[1];
  const asin = asinSide.slice(0, 10);
  return asin;
}

export function getAmazonASINFromURL(url: string) {
  // const asinRegex = new RegExp("/dp/([A-Z0-9]{10})/");
  const asinRegex = new RegExp("/dp/(w{10})");
  const match = url.match(asinRegex);

  if (match) {
    return match[1]; // returns B00HYHRZ0U in this case
  } else {
    return "ASIN not found";
  }
}

export function extractPrice(...elements: any) {
  // priceText.replace(/\D/g, "")
  let price = "";
  for (const [index, element] of elements.entries()) {
    if (element) {
      const priceText = element.text().trim();
      if (priceText) {
        price += `${priceText.replace("$", "")}${
          index === 0 ? (priceText.includes(".") ? "" : ".") : ""
        }`;
      }
    }
  }
  return price;
}

export function extractCurrency(element: any) {
  const currencyText = element.text().trim();
  return currencyText ? currencyText : "";
}

export function getHighestPrice(priceList: PriceHistoryItem[]) {
  let highestPrice = priceList[0];

  for (let i = 0; i < priceList.length; i++) {
    if (priceList[i].price > highestPrice.price) {
      highestPrice = priceList[i];
    }
  }

  return highestPrice.price;
}

export function getLowestPrice(priceList: PriceHistoryItem[]) {
  let lowestPrice = priceList[0];

  for (let i = 0; i < priceList.length; i++) {
    if (priceList[i].price < lowestPrice.price) {
      lowestPrice = priceList[i];
    }
  }

  return lowestPrice.price;
}

export function getAveragePrice(priceList: PriceHistoryItem[]) {
  const sumOfPrices = priceList.reduce((acc, curr) => acc + curr.price, 0);
  const averagePrice = sumOfPrices / priceList.length || 0;

  return averagePrice;
}

export const getEmailNotifType = (
  scrapedProduct: Product,
  currentProduct: Product
) => {
  const lowestPrice = getLowestPrice(currentProduct.priceHistory);

  if (scrapedProduct.currentPrice < lowestPrice) {
    return Notification.LOWEST_PRICE as keyof typeof Notification;
  }
  if (!scrapedProduct.isOutOfStock && currentProduct.isOutOfStock) {
    return Notification.CHANGE_OF_STOCK as keyof typeof Notification;
  }
  if (scrapedProduct.discountRate >= THRESHOLD_PERCENTAGE) {
    return Notification.THRESHOLD_MET as keyof typeof Notification;
  }

  return null;
};

export const formatNumber = (num: number = 0) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
