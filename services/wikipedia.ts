const SUMMARY_ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export interface WikiSummary {
    title: string;
    extract: string;
    extract_html?: string;
    content_urls?: {
        desktop?: { page: string };
        mobile?: { page: string };
    };
}

export const fetchWikiSummary = async (query: string): Promise<WikiSummary> => {
    const normalized = query.trim();
    if (!normalized) {
        throw new Error("Please provide a search term.");
    }

    const response = await fetch(`${SUMMARY_ENDPOINT}${encodeURIComponent(normalized)}`);
    if (!response.ok) {
        throw new Error("No matching article found.");
    }

    const data = (await response.json()) as WikiSummary & { extract?: string };
    if (!data.extract) {
        throw new Error("Article summary unavailable.");
    }
    return data;
};

