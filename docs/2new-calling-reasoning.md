# OpenAI Responses API Documentation

This document outlines the usage of the OpenAI Responses API, including an example request, the resulting response, with summary of the reasoning and a detailed list of available parameters.

Reasoning summaries allow the Responses API to generate concise, natural-language summaries of a model’s internal chain-of-thought. Reasoning summaries are available at no additional cost.

## Example Request

Use the following `curl` command to call the OpenAI LLM API via the Responses endpoint:

```bash
curl --location 'https://api.znapai.com/v1/responses' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-J7Q4gVU6PZEspHx5VwxW_Q' \
--data '{
    "model": "o3-pro",
    "input": "give keywords to list headphone on amazon",
    "reasoning": {
      "effort": "medium",
      "summary": "auto"
    }
}'
```

## Example Response

The API returns a JSON object containing the model's output and reasoning details. A sample response is shown below:

```json
{
  "id": "resp_bGl0ZWxsbTpjdXN0b21fbGxtX3Byb3ZpZGVyOmF6dXJlO21vZGVsX2lkOjg2ODUwNGY1LWQyZTYtNDY4NC1hZDdkLTI4MDRkYjEwYTM4ZjtyZXNwb25zZV9pZDpyZXNwXzBlNmU4N2RmMmY3YmFjZDEwMDY5NTc5NjRiOTkwNDgxOTZhODQ2YjNlNzc2MzYyYzM1",
  "created_at": 1767347787,
  "error": null,
  "incomplete_details": null,
  "instructions": null,
  "metadata": {},
  "model": "o3-pro",
  "object": "response",
  "output": [
    {
      "id": "rs_0e6e87df2f7bacd10069579687f7e08196ab79e9f83dab6064",
      "summary": [
        {
          "text": "**Generating headphone keywords**\n\nThe user wants keywords for listing a headphone product on Amazon. This likely means they’re looking for suggestions to optimize search results. I should focus on long-tail keywords and key features. Considering Amazon SEO, I can include terms like brand, model, type (wired/wireless), and features such as noise cancelling, comfort, and gaming suitability. I’ll create a bullet list with primary and secondary keywords, starting with options like \"Bluetooth Headphones\" and \"Noise Cancelling Headphones.\" Maybe I should ask for more specific details about the model too!",
          "type": "summary_text"
        },
        {
          "text": "**Crafting secondary keywords**\n\nI’m focusing on secondary keywords necessary for headphone listings. Phrases like \"with Mic,\" \"for iPhone,\" \"Deep Bass,\" and \"Lightweight\" are essential. I also want to include long-tail options such as \"Bluetooth 5.3 Over-Ear Headphones with Mic and Deep Bass.\" It’s important to remember Amazon’s 250-character limit for search terms, so I need to suggest keywords effectively. I’ll compile these suggestions into a final answer with both secondary and long-tail keywords to give a comprehensive overview.",
          "type": "summary_text"
        }
      ],
      "type": "reasoning",
      "status": null
    },
    {
      "id": "msg_0e6e87df2f7bacd10069579689c7048196bab0434da257d95f",
      "content": [
        {
          "annotations": [],
          "text": "Below is a bank of high-traffic, high-relevancy search terms you can mix and match when creating your Amazon title, bullet points and back-end Search Terms field for a generic pair of headphones. Pick only the phrases that truly describe your product; Amazon may suppress a listing if the keywords are misleading.\n\nPRIMARY (core “what it is” words)  \n• bluetooth headphones  \n• wireless headphones  \n• wired headphones  \n• over ear headphones  \n• on ear headphones  \n• in ear headphones / earbuds  \n• gaming headset  \n• noise cancelling headphones / ANC headphones  \n• stereo headset  \n• USB-C headphones  \n• lightning headphones (for iPhone)\n\nFEATURE / BENEFIT (combine with a primary term)  \n• with microphone / with mic  \n• deep bass / extra bass  \n• hi-fi stereo sound  \n• 40 hour battery / long battery life / fast charge  \n• foldable / collapsible / portable  \n• lightweight / ultra-light  \n• comfort memory-foam earcups / soft ear cushions  \n• sweatproof / IPX8 waterproof  \n• low-latency / 3D surround  \n• dual-device pairing / multipoint  \n• Bluetooth 5.3 / Bluetooth 5.2  \n• USB-C quick charge  \n• wired-wireless dual mode  \n• adjustable headband / ergonomic design\n\nTARGET USE / AUDIENCE  \n• for iPhone / for Android / for Samsung  \n• for laptop / PC / Mac  \n• for TV / for airplane travel  \n• gaming / PS5 / Xbox / Nintendo Switch  \n• workout / running / gym / sports  \n• kids / school / e-learning  \n• office / call center / Zoom meetings  \n• music production / studio monitoring  \n• travel / commuting\n\nLONG-TAIL EXAMPLES (keep within Amazon’s 200-250 character limit)  \n• “Bluetooth 5.3 over-ear wireless headphones with mic, ANC, deep bass, 40H playtime, foldable, for iPhone Android laptop”  \n• “USB-C wired gaming headset, noise cancelling mic, 3D surround, RGB lights, for PS5 PC Switch”  \n• “Sweatproof wireless sport earbuds, earhooks, Bluetooth 5.2, hi-fi stereo, 8H + 32H case, for running gym”\n\nBACK-END (Search Terms field) – include alternate spellings & abbreviations (no commas):  \nbluetooth headphone bluetooth head phones earphones head set auriculares cascos casque cuffie audifonos audífonos noise canceling anc noise cancelling wireless headset\n\nTips:  \n1. Stay under the 250-character limit for the back-end Search Terms box.  \n2. Do not repeat words already in your title or brand.  \n3. Omit punctuation, conjunctions, and plurals when possible to save space.  \n4. Never add competitor brand names or inaccurate claims.\n\nUse these keywords strategically to improve visibility while keeping your listing accurate and compliant with Amazon policy.",
          "type": "output_text",
          "logprobs": []
        }
      ],
      "role": "assistant",
      "status": "completed",
      "type": "message"
    }
  ],
  "parallel_tool_calls": true,
  "temperature": 1,
  "tool_choice": "auto",
  "tools": [],
  "top_p": 1,
  "max_output_tokens": null,
  "previous_response_id": null,
  "reasoning": {
    "effort": "medium"
  },
  "status": "completed",
  "text": {
    "format": {
      "type": "text"
    },
    "verbosity": "medium"
  },
  "truncation": "disabled",
  "usage": {
    "input_tokens": 13,
    "input_tokens_details": {
      "audio_tokens": null,
      "cached_tokens": 0,
      "text_tokens": null
    },
    "output_tokens": 879,
    "output_tokens_details": {
      "reasoning_tokens": 256,
      "text_tokens": null
    },
    "total_tokens": 892
  },
  "user": null
}
```



## Key Configuration Options

When utilizing reasoning models (gpt-5 and o-series), you can configure the following:

- **`effort`**: Constrains reasoning effort (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`).
- **`summary`**: Specifies the type of reasoning summary to generate (`auto`, `concise`, `detailed`).

## API Parameters

Below are the parameters available when calling the Responses API.

### Request Body



- **`conversation`** (`string` or `object`, Optional):
  - Defaults to `null`.
  - The conversation that this response belongs to. Items from this conversation are prepended to `input_items`. Output items are automatically added to the conversation after completion.



- **`input`** (`string` or `array`, Optional):
  - Text, image, or file inputs used to generate a response.

- **`instructions`** (`string`, Optional):
  - A system or developer message inserted into the model's context. Overrides instructions from a `previous_response_id`.

- **`metadata`** (`map`, Optional):
  - Up to 16 key-value pairs (String:String). Keys max 64 chars, values max 512 chars.

- **`model`** (`string`, Optional):
  - Model ID (e.g., `gpt-4o`, `o3`).



---



- **`reasoning`** (`object`, Optional, **gpt-5 and o-series only**):
  - Configuration for reasoning models.
  - **`effort`** (`string`, Optional):
    - Defaults to `medium`. Options: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`.
  - **`summary`** (`string`, Optional):
    - Summary of reasoning process. Options: `auto`, `concise`, `detailed`.

- **`temperature`** (`number`, Optional):
  - Defaults to `1`. Range: `0` to `2`.

- **`text`** (`object`, Optional):
  - Configuration for text responses (Plain text or Structured JSON).



JSON mode : https://platform.openai.com/docs/guides/structured-outputs#json-mode