const OpenAI = require("openai").default;

class AIService {
  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPEN_API_KEY,
    });
  }

  async generateComponent(prompt, context = {}) {
    const models = [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.1-8b-instruct:free",
      "microsoft/phi-3-mini-128k-instruct:free",
    ];

    for (let i = 0; i < models.length; i++) {
      try {
        const systemPrompt = this.buildSystemPrompt(context);
        const userPrompt = this.buildUserPrompt(prompt, context);

        console.log(`Attempting AI request with model: ${models[i]}`);

        const completion = await this.openai.chat.completions.create({
          model: models[i],
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const response = completion.choices[0].message.content;
        console.log(`✅ AI request successful with model: ${models[i]}`);
        console.log("Raw AI response:", response.substring(0, 200) + "...");

        const parsedResponse = this.parseResponse(response);
        console.log("Parsed AI response:", parsedResponse);

        return parsedResponse;
      } catch (error) {
        console.error(
          `❌ AI request failed with model ${models[i]}:`,
          error.message
        );
        if (i === models.length - 1) {
          // Last model failed, return a mock component
          console.log("⚠️ All AI models failed, returning mock component");
          return this.getMockComponent(prompt);
        }
        // Try next model
        continue;
      }
    }
  }

  buildSystemPrompt(context) {
    const {
      framework = "react",
      styleFramework = "css",
      typescript = false,
    } = context;

    return `You are an expert frontend developer specializing in ${framework} components. 
Your task is to generate clean, modern, and functional components based on user requests.

Guidelines:
1. Always return BOTH JSX/TSX code AND CSS code
2. Use ${typescript ? "TypeScript" : "JavaScript"} syntax
3. Follow ${framework} best practices and hooks
4. Create responsive, accessible components
5. Use ${styleFramework} for styling
6. Include proper component structure with props and state when needed
7. Add comments for complex logic
8. Ensure the component is self-contained and ready to use

Response Format:
Return your response in the following JSON format:
{
  "jsx": "// Your JSX/TSX component code here",
  "css": "/* Your CSS styles here */",
  "explanation": "Brief explanation of the component",
  "features": ["list", "of", "key", "features"],
  "props": {
    "propName": "description"
  }
}

Make sure the JSON is valid and the code is production-ready.`;
  }

  buildUserPrompt(prompt, context) {
    const { existingCode, isIteration = false } = context;

    if (isIteration && existingCode) {
      return `Current component code:
JSX: ${existingCode.jsx}
CSS: ${existingCode.css}

User request for modification: ${prompt}

Please modify the existing component according to the user's request. Keep the existing structure where possible and only change what's necessary.`;
    }

    return `Create a React component based on this request: ${prompt}

Please ensure the component is:
- Modern and visually appealing
- Responsive across different screen sizes
- Accessible (proper ARIA labels, semantic HTML)
- Well-structured and reusable
- Includes proper styling with CSS`;
  }

  parseResponse(response) {
    try {
      console.log("Parsing AI response...");

      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed as JSON");

        // Ensure required fields exist
        if (!parsed.jsx) {
          console.warn("JSON response missing jsx field, adding default");
          parsed.jsx = "// No JSX code provided";
        }
        if (!parsed.css) {
          parsed.css = "/* No styles provided */";
        }

        return parsed;
      }

      console.log("No JSON found, extracting code blocks...");

      // Fallback: extract code blocks
      const jsxMatch = response.match(
        /```(?:jsx|tsx|javascript|typescript)?\n([\s\S]*?)\n```/
      );
      const cssMatch = response.match(/```css\n([\s\S]*?)\n```/);

      const result = {
        jsx: jsxMatch ? jsxMatch[1] : response,
        css: cssMatch ? cssMatch[1] : "/* No styles provided */",
        explanation: "Component generated successfully",
        features: ["Generated component"],
        props: {},
      };

      console.log("Extracted code blocks result:", result);
      return result;
    } catch (error) {
      console.error("Response parsing error:", error);

      // Final fallback - return the raw response as jsx
      return {
        jsx: response || "// Error generating component",
        css: "/* No styles provided */",
        explanation: "Component generated with basic parsing",
        features: ["Generated component"],
        props: {},
      };
    }
  }

  async refineComponent(originalCode, refinementPrompt, context = {}) {
    const refinementContext = {
      ...context,
      existingCode: originalCode,
      isIteration: true,
    };

    return await this.generateComponent(refinementPrompt, refinementContext);
  }

  async generateMultipleVariations(prompt, count = 3, context = {}) {
    const variations = [];

    for (let i = 0; i < count; i++) {
      const variationPrompt = `${prompt} (Variation ${
        i + 1
      }: Create a different design approach)`;
      const variation = await this.generateComponent(variationPrompt, context);
      variations.push({
        id: i + 1,
        ...variation,
      });
    }

    return variations;
  }

  validateGeneratedCode(code) {
    const errors = [];

    // Basic JSX validation
    if (!code.jsx || code.jsx.trim().length === 0) {
      errors.push("No JSX code provided");
    }

    // Check for basic React structure
    if (code.jsx && !code.jsx.includes("return")) {
      errors.push("JSX code missing return statement");
    }

    // Check for component export
    if (code.jsx && !code.jsx.includes("export")) {
      errors.push("Component should be exported");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getMockComponent(prompt) {
    return {
      jsx: `import React from 'react';

const MockComponent = () => {
  return (
    <div className="mock-component">
      <h2>Mock Component</h2>
      <p>This is a mock component generated because AI services are temporarily unavailable.</p>
      <p>Your request: "${prompt}"</p>
      <button className="mock-button">Click me</button>
    </div>
  );
};

export default MockComponent;`,
      css: `.mock-component {
  padding: 20px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  text-align: center;
  background-color: #f9f9f9;
  margin: 20px;
}

.mock-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.mock-button:hover {
  background-color: #0056b3;
}`,
      explanation:
        "This is a mock component generated when AI services are unavailable. You can use this as a starting point and try again when the AI service is restored.",
      features: ["Mock component", "Basic styling", "Placeholder content"],
      props: {},
    };
  }
}

module.exports = new AIService();
