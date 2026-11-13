import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildSnippet, selfHostCommands } from "@/content/self-host";

describe("buildSnippet", () => {
  const snippet = buildSnippet([
    { comment: "say hello" },
    { cmd: "echo hi" },
    { cmd: "echo <b>" },
  ]);

  it("copies commands only, without prompts or comments", () => {
    expect(snippet.copy).toBe("echo hi\necho <b>");
  });

  it("renders prompts and comments, one line each", () => {
    const html = renderToStaticMarkup(<>{snippet.render}</>);
    expect(html).toContain("# say hello");
    expect(html).toContain("$ </span>echo hi");
    expect(html.split("\n")).toHaveLength(3);
  });

  it("escapes command text when rendering", () => {
    const html = renderToStaticMarkup(<>{snippet.render}</>);
    expect(html).toContain("echo &lt;b&gt;");
  });

  it("produces nothing for an empty list", () => {
    expect(buildSnippet([]).copy).toBe("");
  });

  it("puts the repository URL in the published deploy snippet", () => {
    expect(selfHostCommands.copy.split("\n")[0]).toMatch(/^git clone https:\/\/github\.com\//);
    expect(selfHostCommands.copy).not.toContain("#");
  });
});
