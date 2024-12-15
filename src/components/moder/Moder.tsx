import { useEffect, useState } from "react";
import OpenAI from "openai";

const openai = new OpenAI({
  project: import.meta.env.VITE_OPENAI_PROJ_ID,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function Moder() {
  const [response, setResponse] =
    useState<OpenAI.Moderations.ModerationCreateResponse>();
  const [prompt, setPrompt] = useState("");

  const getModeration = async (prompt: string) =>
    openai.moderations
      .create({
        input: prompt || "Hello!",
      })
      .then((res) => setResponse(res));

  useEffect(() => {
    if (prompt) {
      getModeration(prompt).then((res) => {
        console.log("response", res);
      });
    }
  }, [prompt]);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPrompt(e.currentTarget?.[0].value);
        }}
      >
        <input type="text" />
        <button type="submit">Send</button>
      </form>
      <pre>
        {response
          ? JSON.stringify(response, null, 2)
          : "Make a request for moderation"}
      </pre>
    </div>
  );
}
