import { getQaByTopic, getQaCategories, searchQa } from "@/features/qa/offlineQaStore";

jest.mock("@/db/database", () => ({
  getDB: jest.fn(),
  initDB: jest.fn()
}));

jest.mock("@/db/localDbAccess", () => ({
  getLocalDbErrorMessage: jest.fn(() => "db error"),
  runLocalDb: jest.fn()
}));

describe("localized offline QA", () => {
  it("returns English category labels with stable Bengali topic keys", () => {
    const categories = getQaCategories("en");

    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "danger_signs", label: "Danger signs", topic: "জরুরি_লক্ষণ" }),
        expect.objectContaining({ id: "nutrition", label: "Nutrition and food", topic: "পুষ্টি_ও_খাবার" })
      ])
    );
  });

  it("returns English basic questions and answers for each visible category", async () => {
    const categories = getQaCategories("en");

    for (const category of categories) {
      const trimester = category.id === "postpartum_care" || category.id === "breastfeeding" ? "POSTPARTUM" : "T3";
      const rows = await getQaByTopic({ topic: category.topic, trimester, language: "en" });
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0].question_bn).toMatch(/[A-Za-z]/);
      expect(rows[0].answer_bn).toMatch(/[A-Za-z]/);
    }
  });

  it("searches English QA content without using the local Bangla database", async () => {
    const results = await searchQa("headache blurred vision", "T3", "en");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].answer_bn).toMatch(/danger|emergency|urgent/i);
  });

  it("translates Banglish query to Bengali script before searching the local database", async () => {
    const mockGetAllAsync = jest.fn().mockResolvedValue([]);
    const mockDb = { getAllAsync: mockGetAllAsync };
    const { getDB } = require("@/db/database");
    const { runLocalDb } = require("@/db/localDbAccess");
    
    getDB.mockResolvedValue(mockDb);
    runLocalDb.mockImplementation(async (cb: any) => cb());
    
    await searchQa("matha betha", "T3", "bn");
    
    expect(mockGetAllAsync).toHaveBeenCalled();
    const sqlQuery = mockGetAllAsync.mock.calls[0][0];
    const bindings = mockGetAllAsync.mock.calls[0].slice(2); // First is topic/trimester, then bindings
    
    expect(sqlQuery).toContain("question_bn LIKE ?");
    expect(bindings).toContain("%মাথা%");
    expect(bindings).toContain("%ব্যথা%");
  });
});
