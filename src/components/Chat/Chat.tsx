import { FormEvent, useEffect, useState } from "react";
import styles from "./Chat.module.css";
import { dates } from "../../utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import OpenAI from "openai";
const openai = new OpenAI({
  project: import.meta.env.VITE_OPENAI_PROJ_ID,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const createCompletion = async (input: string | string[]) =>
  await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2048,
    temperature: 1.1,
    user: "some_unique_anonymized_user_key",
    // presence_penalty: 0, // higher value = more likely to talk about new topics or concepts.
    // frequency_penalty: 0, // higher value = less likely to repeat the same line verbatim.
    // stop: ["\n"], // will stop response when it encounters a newline character.
    messages: [
      {
        role: "system",
        content:
          "You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stocks performance and recommending whether to buy, hold or sell.",
      },
      // {
      //   role: "system",
      //   content:
      //     "You are a trading market guru. Make a market forecast based on the input provided. Use the examples provided between ~~ to set the style of your response.",
      // },
      {
        role: "user",
        content: `Please advice should I buy or sell based on this report: ${input}`,
      },
      // {
      //   role: "user",
      //   content: `${input}

      //   ~~
      //   Hey yo fella! Here is a cool shit I wanna you to know. For TSLA - forget it, just sell all what you've got. For INTC - I'm not sure man, judge yourself. For the NVDA - 100% hold and watch how they gonna explode in the next months.
      //   ~~

      //   ~~
      //   Maniga, just sell INTC - it sux. Hold on TSLA - they seem OK. 100% keep NVDA for now!
      //   ~~
      //   `,
      // },
    ],
    // max_tokens: 150 // is Infinite by default. It is a bad way to cut messages
  });

export default function Chat() {
  console.log("rerender");
  const [loading, setLoading] = useState(false);

  const [ticker, setTicker] = useState("");
  const [tickerList, setTickerList] = useState<string[]>([]);

  const [openaiError, setOpenaiError] = useState("");

  const [polygonData, setPolygonData] = useState<string>("");
  const [status, setStatus] = useState("");
  const [polygonError, setPolygonError] = useState("");

  const [completion, setCompletion] =
    useState<OpenAI.Chat.Completions.ChatCompletion | null>(null);

  // Ticket examples are: NVDA, TSLA, INTC
  const handleSubmit = (event: FormEvent<HTMLFormElement> | undefined) => {
    event?.preventDefault();
    event?.stopPropagation();

    setPolygonError("");
    setStatus("");

    if (event) {
      const formData = new FormData(event.currentTarget);
      const inputValue = String(formData.get("my-custom-opeai-request"));
      if (inputValue) {
        console.log({ inputValue });
        setLoading(true);
        setTicker(inputValue);
      }
    }
  };

  // When one ticket is added - fetch polygon for the stock data
  useEffect(() => {
    if (ticker) {
      console.log("use eff", ticker);

      async function fetchData() {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${
          dates.startDate
        }/${dates.endDate}?apiKey=${import.meta.env.VITE_POLYGON_KEY}`;

        const response = await fetch(url);
        const data = await response.text();
        const status = await response.status;

        console.log({ data });

        if (status === 200) {
          setStatus("Creating report...");
          setPolygonData(data);
          setTickerList((list) => [...list, data]);
        } else {
          setPolygonError("There was an error fetching stock data.");
        }

        setLoading(false);
        setTicker("");
      }

      try {
        fetchData();
      } catch (err) {
        console.error(err);
        setLoading(false);
        setPolygonError(String(err));
      }
    }
  }, [ticker]);

  // TODO: When 3 tickers are added - fetch opeani for a report/forecast
  useEffect(() => {
    if (tickerList.length >= 3) {
      const sanitizedTickerList = tickerList.map((ticker) => {
        const newTicker = JSON.parse(ticker);
        delete newTicker.status;
        delete newTicker.request_id;
        delete newTicker.adjusted;
        delete newTicker.resultsCount;
        return JSON.stringify(newTicker);
      });
      async function fetchData() {
        const response = await createCompletion(sanitizedTickerList);
        setLoading(false);
        setCompletion(response);
      }
      try {
        fetchData();
      } catch (error) {
        setOpenaiError(String(error));
      }
    }
  }, [polygonData, tickerList]);

  return (
    <div className={styles.chatWrapper}>
      <h2>Chat</h2>
      <div>Ticker list: {tickerList}</div>
      <h2>
        Enter ticker <i>(usually 4 letter, like "TSLA", "NVDA", "INTC")</i>
      </h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", alignItems: "center" }}
      >
        <input
          type="text"
          name="my-custom-opeai-request"
          placeholder="Ticker name"
          style={{ height: "34px" }}
        />
        <button type="submit">Submit</button>
      </form>
      <div>{openaiError && `Error: ${openaiError}`}</div>
      <div>{loading && "Loading..."}</div>
      <div
        style={{
          margin: "1rem 0",
          padding: "1rem",
          border: "1px solid #bbb",
          borderRadius: "1rem",
        }}
      >
        {!loading && completion?.choices?.[0]?.message?.content ? (
          <Markdown remarkPlugins={[remarkGfm]}>
            {completion?.choices?.[0]?.message?.content}
          </Markdown>
        ) : (
          "No data yet"
        )}
      </div>
      <br />
      <br />
      <div>{polygonError && `Polygon error: ${polygonError}`}</div>
      <div style={{ maxWidth: "600px", wordBreak: "break-all" }}>
        Polygon data: {polygonData}
      </div>
      <br />
      <div>{status && `Polygon message: ${status}`}</div>
      <div>
        <i>Tokens used: {completion?.usage?.total_tokens}</i>
      </div>
    </div>
  );
}
