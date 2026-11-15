import { Liquid } from "liquidjs";
import { baseEmailLayout } from "./layout";
import { emailTemplates } from "./templates";
import * as nodemailer from "nodemailer";

export type EmailTemplateName = keyof typeof emailTemplates;

export interface RenderResult {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateEngine {
  private liquid: Liquid;

  constructor() {
    this.liquid = new Liquid({
      strictVariables: false,
      cache: process.env.NODE_ENV === "production"
    });
  }

  public async render(templateName: EmailTemplateName, context: Record<string, any>): Promise<RenderResult> {
    const templateDef = emailTemplates[templateName];
    if (!templateDef) {
      throw new Error(`Email template '${templateName}' not found.`);
    }

    const defaultContext = {
      brandName: "Fade Barbershop",
      year: new Date().getFullYear(),
      ...context
    };

    // Render subject
    const subject = await this.liquid.parseAndRender(templateDef.subject, defaultContext);

    // Render content HTML
    const contentHtml = await this.liquid.parseAndRender(templateDef.html, defaultContext);

    // Wrap in base layout
    const layoutContext = {
      ...defaultContext,
      subject,
      contentHtml
    };

    const html = await this.liquid.parseAndRender(baseEmailLayout, layoutContext);

    // Simple plain text version fallback
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return { subject, html, text };
  }
}

export function createTestTransporter() {
  return nodemailer.createTransport({
    jsonTransport: true
  });
}
