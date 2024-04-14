import axios from "axios";
import * as cheerio from "cheerio";
import {
  extractCurrency,
  extractPrice,
  extractValueFromAmazonURL,
} from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    // Fetch product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract product title
    const title = $("#productTitle").text().trim();

    // let currentPrice = "";
    // const currentPrice = extractPrice(
    //   $("span.reinventPricePriceToPayMargin span span.a-price-whole").first(),
    //   $("span.reinventPricePriceToPayMargin span span.a-price-fraction").first()
    // );

    let currentPrice = "";
    $(".a-price.reinventPricePriceToPayMargin").each((i, elem) => {
      const wholePrice = $(elem).find(".a-price-whole").text();
      const fractionPrice = $(elem).find(".a-price-fraction").text();
      currentPrice = `${wholePrice}.${fractionPrice}`;
    });

    const originalPrice = extractPrice(
      $(".basisPrice span.a-text-price span.a-offscreen").first()
    );

    console.log({ title, currentPrice, originalPrice });

    const outOfStock = $("#availability span")
      .text()
      .trim()
      .toLowerCase()
      .includes("currently unavailable");

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($(".a-price-symbol").first());

    const discountRate = $(".savingsPercentage")
      .first()
      .text()
      .replace(/[-%]/g, "");

    const description = [] as string[];
    $("#feature-bullets ul.a-unordered-list span.a-list-item").each(function (
      i,
      elem
    ) {
      description[i] = $(this).text().trim();
    });

    const reviewsCount = $("#acrCustomerReviewText")
      .first()
      .text()
      .trim()
      .replace(" ratings", "")
      .replace(",", "");

    const stars = $("#averageCustomerReviews span.a-size-base")
      .first()
      .text()
      .trim();

    const category = $(
      "#wayfinding-breadcrumbs_feature_div ul.a-unordered-list li"
    )
      .last()
      .text()
      .trim();

    // const asin = $("input#ASIN").attr("value");

    const asin = extractValueFromAmazonURL(url);

    const data = {
      asin,
      url: asin ? `https://www.amazon.com/dp/${asin}` : url,
      image: imageUrls[0],
      title,
      description: description.join(". "),
      currency: currency || "$",
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      discountRate: Number(discountRate) || 0,
      priceHistory: [
        {
          price: Number(currentPrice) || Number(originalPrice),
          date: new Date(),
        },
      ],
      category,
      reviewsCount: Number(reviewsCount) || 0,
      stars: Number(stars) || 0,
      isOutOfStock: outOfStock,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };

    return data;
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to scrape Amazon product: ${error.message}`);
  }
}
