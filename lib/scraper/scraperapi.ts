import { format } from "path";
import {
  formatPricing,
  getAmazonASINFromURL,
  getCurrencyFromPrice,
  getDiscount,
} from "../utils";

export async function scrapeAmazonProduct(url: string) {
  const asin = getAmazonASINFromURL(url);

  if (!asin) return;

  try {
    const req = await fetch(
      `https://api.scraperapi.com/structured/amazon/product?api_key=${process.env.SCRAPER_API_KEY}&asin=${asin}&country_code=us&tld=com`
    );

    const prod = await req.json();

    const result = {
      asin,
      url: `https://www.amazon.com/dp/${asin}`,
      image: prod.images[0],
      title: prod.name,
      description: prod.feature_bullets.join(" "),
      currency: getCurrencyFromPrice(prod.pricing) || "$",
      currentPrice: formatPricing(prod.pricing),
      originalPrice: formatPricing(prod.list_price),
      discountRate: getDiscount(prod.pricing, prod.list_price),
      priceHistory: [
        {
          price: formatPricing(prod.pricing),
          date: new Date(),
        },
      ],
      category: prod.product_category,
      reviewsCount: prod.total_reviews,
      stars: prod.average_rating,
      isOutOfStock: prod.availability_status === "In Stock" ? false : true,
      lowestPrice: formatPricing(prod.pricing),
      highestPrice: formatPricing(prod.list_price),
      averagePrice: formatPricing(prod.pricing),
    };

    return result;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`Failed to scrape Amazon product: ${error.message}`);
  }
}
