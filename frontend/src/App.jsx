import { useEffect, useState } from "react";

const MOOD_BG = {
  positive: "#FFF4D6",
  negative: "#E7EEFF",
  neutral: "#F0F0F0",
};

export default function App() {
  const [entries, setEntries] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    const res = await fetch("/api/diary");
    setEntries(await res.json());
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setContent("");
      await fetchEntries();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await fetch(`/api/diary/${id}`, { method: "DELETE" });
    await fetchEntries();
  };

  return (
    <div className="page">
      <h1>오늘의 기분 제발 CI/CD📓</h1>
      <p className="subtitle">
        한 줄만 적으면 AI(mood-model)가 오늘의 기분을 분석해줘요.
      </p>

      <form onSubmit={submit} className="entry-form">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루 어땠나요?"
        />
        <button disabled={loading} type="submit">
          {loading ? "분석 중..." : "기록하기"}
        </button>
      </form>

      <ul className="entry-list">
        {entries.map((e) => (
          <li
            key={e.id}
            className="entry-card"
            style={{ background: MOOD_BG[e.mood] || "#fff" }}
          >
            <div className="entry-top">
              <span className="emoji">{e.emoji}</span>
              <span className="content">{e.content}</span>
              <button className="delete" onClick={() => remove(e.id)}>
                ✕
              </button>
            </div>
            <div className="comment">{e.comment}</div>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="empty">아직 기록이 없어요. 첫 줄을 남겨보세요!</li>
        )}
      </ul>
    </div>
  );
}
