
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDQFUa1LGkonbd7152FK6roHyLs4FhMsVM";

const genAI = new GoogleGenerativeAI(API_KEY);

export interface GenerationOptions {
  prompt: string;
  type: 'story' | 'poem' | 'script' | 'article' | 'general';
  tone?: 'creative' | 'professional' | 'casual' | 'dramatic' | 'mysterious';
  length?: 'short' | 'medium' | 'long';
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  async generateContent(options: GenerationOptions): Promise<string> {
    const { prompt, type, tone = 'creative', length = 'medium' } = options;
    
    const enhancedPrompt = this.buildPrompt(prompt, type, tone, length);
    
    try {
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  async improveContent(content: string, improvement: string): Promise<string> {
    const prompt = `Please improve this content based on the following request: "${improvement}"\n\nOriginal content:\n${content}\n\nProvide the improved version:`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error improving content:', error);
      throw new Error('Failed to improve content. Please try again.');
    }
  }

  async getSuggestions(currentContent: string, type: string): Promise<string[]> {
    const prompt = `Based on this ${type}: "${currentContent}", provide 3 creative suggestions for what could come next. Return only the suggestions, one per line.`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().split('\n').filter(line => line.trim()).slice(0, 3);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw new Error('Failed to get suggestions. Please try again.');
    }
  }

  private buildPrompt(userPrompt: string, type: string, tone: string, length: string): string {
    const lengthGuide = {
      short: '1-2 paragraphs',
      medium: '3-5 paragraphs',
      long: '6-10 paragraphs'
    };

    const typeInstructions = {
      story: 'Create an engaging narrative with characters, plot, and vivid descriptions.',
      poem: 'Write a creative poem with rhythm, imagery, and emotional depth.',
      script: 'Write in screenplay format with dialogue, action lines, and scene descriptions.',
      article: 'Write an informative and well-structured article.',
      general: 'Create creative and engaging content.'
    };

    return `You are a professional ${type} writer. Create a ${tone} ${type} that is ${lengthGuide[length]} long.

${typeInstructions[type]}

User request: ${userPrompt}

Make it creative, engaging, and high-quality. Use vivid language and compelling storytelling techniques.`;
  }
}

export const geminiService = new GeminiService();
