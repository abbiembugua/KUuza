// src/services/geminiService.jsx (or .js)
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with your API key - make sure you have REACT_APP_GEMINI_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY || "");

// Create the Gemini service class
class GeminiService {
  constructor() {
    // Use gemini-1.5-flash for faster, cheaper responses
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });
  }

  // Generate product description
  async generateProductDescription(title, category) {
    try {
      const prompt = `Generate a compelling product description for a ${category} titled "${title}". 
      Make it engaging for university students. Include condition, features, and reason for selling.
      Keep it concise (2-3 sentences). Format: Don't use markdown.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Unable to generate description. Please write your own.";
    }
  }

  // Generate listing title
  async generateListingTitle(category, keywords) {
    try {
      const prompt = `Generate an attractive listing title for a ${category} on a campus marketplace.
      Keywords: ${keywords.join(', ')}.
      Make it catchy and student-friendly (max 60 characters). Format: Plain text only.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return null;
    }
  }

  // Categorize item automatically
  async categorizeItem(title, description) {
    try {
      const prompt = `Categorize this item for a campus marketplace:
      Title: "${title}"
      Description: "${description}"
      
      Choose from these categories: Books, Electronics, Fashion, Furniture, Services, Food & Beverages, Other
      Return only the category name.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Other";
    }
  }

  // Suggest price based on description
  async suggestPrice(title, category, condition) {
    try {
      const prompt = `Suggest a reasonable price in KES (Kenyan Shillings) for this item on a campus marketplace:
      Item: ${title}
      Category: ${category}
      Condition: ${condition}
      
      Consider it's for university students. Return only the price number.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Extract numbers from response
      const priceMatch = text.match(/\d+/);
      return priceMatch ? parseInt(priceMatch[0]) : null;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return null;
    }
  }
}

// Create instance
const geminiService = new GeminiService();

// Export as default
export default geminiService;