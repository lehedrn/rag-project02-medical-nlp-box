import json
import logging
import os
import re
from typing import Dict
from openai import OpenAI
from dotenv import load_dotenv

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# 六大类
CATEGORIES_EN = [
    "Macroeconomics", 
    "Securities and Capital Markets",
    "Investment Analysis and Trading",
    "Banking and Credit",
    "Financial Derivatives",
    "Financial Regulation and Institutions"
]

CATEGORIES_ZH = [
    "宏观经济学",
    "证券与资本市场",
    "投资分析与交易",
    "银行与信贷",
    "金融衍生品",
    "金融监管机构"
]

class FinNerService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url=os.getenv("DEEPSEEK_BASE_URL"),
        )
        self.categories = CATEGORIES_EN  # 默认使用英文类别

    def process(self, text: str, term_types: Dict[str, bool] = None):

        categories_str = "\n".join([f"- {category}" for category in self.categories])

        system_prompt = f"""
You are a helpful assistant that extracts financial NER (Named Entity Recognition)  from text.

Given an English financial sentence, your task is to:

1. Identify all **financial terms** in the sentence.
2. For each term, classify it into **one of the following six categories ONLY**:

{categories_str}

3. For each term, also:
- Return a confidence `score` between 0.0 and 1.0.
- Include the `start` and `end` character positions of the term **within the original sentence**.

**Very Important:**
- Only use the six categories above.
- Do NOT make up new categories.
- `start` is the character index where the term begins in the sentence.
- `end` is the character index where the term ends (exclusive).
- Output only JSON. No explanation.

Your output must be a JSON array of objects. Each object must include:

- `"word"`: the financial term  
- `"entity_group"`: one of the six categories  
- `"score"`: confidence score (0.0 - 1.0)  
- `"start"`: character start position  
- `"end"`: character end position (exclusive)
        """

        user_prompt = f"Sentence: \n{text}"
        
        response = self.client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0.0,
        )

        if not response.choices or not response.choices[0].message:
            logger.error("No response from the model")
            raise ValueError("No response from the model")

        result = response.choices[0].message.content.strip()

        result = self._parse_result(result)

        # 将result转换成dict
        try:
            result = json.loads(result)
        except json.JSONDecodeError:
            logger.error("Failed to decode JSON")
            raise ValueError("Failed to decode JSON")

        filtered_result = self._filter_entities(result, term_types)

        return {
            "text": text,
            "entities": filtered_result
        }
    
    def _filter_entities(self, entities, term_types: Dict[str, bool]):

        filtered_result = []
        for entity in entities:
            if term_types.get('allFinancialTerms', False):
                filtered_result.append(entity)
            elif (term_types.get('Macro', False) and entity['entity_group'] == "Macroeconomics") or \
                 (term_types.get('SCM', False) and entity['entity_group'] == "Securities and Capital Markets") or \
                 (term_types.get('IAT', False) and entity['entity_group'] == "Investment Analysis and Trading") or \
                 (term_types.get('BC', False) and entity['entity_group'] == "Banking and Credit") or \
                 (term_types.get('FD', False) and entity['entity_group'] == "Financial Derivatives") or \
                 (term_types.get('FRI', False) and entity['entity_group'] == "Financial Regulation and Institutions"):
                filtered_result.append(entity)

        return filtered_result


    def _parse_result(self, result: str):
        """
        解析结果，提取 JSON 字符串"""
        match = re.search(r"```json\s*(.*?)\s*```", result, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            # 2. 如果没有 Markdown 包裹，直接用原文本
            json_str = result.strip()
        return json_str



# if __name__ == "__main__":
#     service = FinNerService()
#     sample_text = "Despite the recent market volatility, the central bank's dovish stance and the uptick in consumer confidence have fueled a bullish sentiment across equity markets, particularly in blue-chip stocks."
#     result = service.process(
#         text=sample_text, 
#         term_types={
#             "allFinancialTerms": True,
#         }
#     )
#     print(json.dumps(result, indent=2, ensure_ascii=False))
