import { describe, expect, it } from "vitest";
import {
  attributionToProfileProperties,
  attributionToUtmQuery,
  deriveUtmMedium,
} from "./attribution";

describe("deriveUtmMedium", () => {
  it("maps invite signals to invite", () => {
    expect(deriveUtmMedium({ afSub1: "invite" })).toBe("invite");
    expect(deriveUtmMedium({ mediaSource: "friend_invite" })).toBe("invite");
  });

  it("maps organic media source", () => {
    expect(deriveUtmMedium({ mediaSource: "organic" })).toBe("organic");
  });

  it("maps paid networks to cpc", () => {
    expect(deriveUtmMedium({ mediaSource: "reddit_int" })).toBe("cpc");
    expect(deriveUtmMedium({ mediaSource: "Facebook Ads" })).toBe("cpc");
  });
});

describe("attributionToUtmQuery", () => {
  it("maps AppsFlyer fields to OpenPanel UTM query keys", () => {
    expect(
      attributionToUtmQuery({
        mediaSource: "reddit_int",
        campaign: "launch_fr",
        adset: "feed_a",
        adgroup: "ignored_when_adset",
        keywords: "musculation",
      }),
    ).toEqual({
      utm_source: "reddit_int",
      utm_medium: "cpc",
      utm_campaign: "launch_fr",
      utm_term: "musculation",
      utm_content: "feed_a",
    });
  });

  it("falls back adgroup to utm_content", () => {
    expect(
      attributionToUtmQuery({
        mediaSource: "googleadwords_int",
        adgroup: "kw_group",
      }),
    ).toMatchObject({
      utm_source: "googleadwords_int",
      utm_content: "kw_group",
    });
  });

  it("uses friend_invite source when only invite sub1 is present", () => {
    expect(attributionToUtmQuery({ afSub1: "invite" })).toEqual({
      utm_source: "friend_invite",
      utm_medium: "invite",
    });
  });
});

describe("attributionToProfileProperties", () => {
  it("exposes both af_* and utm_* properties", () => {
    const props = attributionToProfileProperties({
      mediaSource: "reddit_int",
      campaign: "c1",
      isRetargeting: false,
    });
    expect(props.af_media_source).toBe("reddit_int");
    expect(props.af_campaign).toBe("c1");
    expect(props.af_is_retargeting).toBe(false);
    expect(props.utm_source).toBe("reddit_int");
    expect(props.utm_medium).toBe("cpc");
    expect(props.utm_campaign).toBe("c1");
  });
});
