import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { faq } from "@/content/faq";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  pageMetadata,
  serializeJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";
import { routes, site } from "@/lib/site";

describe("serializeJsonLd", () => {
  it("cannot be used to close the script tag it is embedded in", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>");
  });

  it("round-trips to the same data", () => {
    const data = { a: "<b>", nested: [1, "x<y"] };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});

describe("pageMetadata", () => {
  it("points canonical, Open Graph and Twitter at the same page", () => {
    const meta = pageMetadata({ title: "T", description: "D", path: "/security" });
    expect(meta.alternates?.canonical).toBe(`${site.url}/security`);
    expect(meta.openGraph).toMatchObject({ title: "T", description: "D", url: `${site.url}/security` });
    expect(meta.twitter).toMatchObject({ title: "T", description: "D" });
  });
});

describe("structured data", () => {
  it("describes a free application", () => {
    const app = softwareApplicationJsonLd();
    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app.offers.price).toBe("0");
  });

  it("emits one FAQ entry per visible question, with the same text", () => {
    const data = faqJsonLd(faq);
    expect(data.mainEntity).toHaveLength(faq.length);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: faq[0].question,
      acceptedAnswer: { "@type": "Answer", text: faq[0].answer },
    });
  });

  it("handles an empty FAQ list", () => {
    expect(faqJsonLd([]).mainEntity).toEqual([]);
  });

  it("numbers breadcrumbs from 1 with absolute URLs", () => {
    const data = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Security", path: "/security" },
    ]);
    expect(data.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, `${site.url}/`],
      [2, `${site.url}/security`],
    ]);
  });
});

describe("crawler files", () => {
  it("lists every route in the sitemap as an absolute URL", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(routes.map((r) => new URL(r.path, site.url).toString()));
  });

  it("allows crawling and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe(`${site.url}/sitemap.xml`);
  });
});

describe("copy limits", () => {
  it("keeps the default title and description short enough to show whole in results", () => {
    expect(site.title.length).toBeLessThanOrEqual(60);
    expect(site.description.length).toBeLessThanOrEqual(160);
  });
});
