import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { TextInput } from '../components/shared/ModelOptions';
import { API_BASE_URL } from '../App';

const color_map = {
    "Macroeconomics": "#FF0000", // 鲜红
    "Securities and Capital Markets": "#00FF00", // 鲜绿
    "Investment Analysis and Trading": "#0000FF", // 鲜蓝
    "Banking and Credit": "#FFFF00", // 鲜黄
    "Financial Derivatives": "#FF00FF", // 鲜紫
    "Financial Regulation and Institutions": "#00FFFF", // 鲜青
    "Others": "#FF9800", // 原色
};

const FinnerPage = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [coloredResult, setColoredResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [termTypes, setTermTypes] = useState({
    Macro: false,
    SCM: false,
    IAT: false,
    BC: false,
    FD: false,
    FRI: false,
    allFinancialTerms: false,
  });

  const handleTermTypeChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'allFinancialTerms') {
      setTermTypes({
        Macro: false,
        SCM: false,
        IAT: false,
        BC: false,
        FD: false,
        FRI: false,
        allFinancialTerms: checked
      });
    } else {
      setTermTypes({ ...termTypes, [name]: checked });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/finner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input, options: {}, termTypes }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      setColoredResult(generateColoredResult(data.text, data.entities));
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while processing the request.');
      setColoredResult('');
    }
    setIsLoading(false);
  };

  const generateColoredResult = (text, entities) => {
    let result = text;
    entities.sort((a, b) => b.start - a.start);
    
    for (const entity of entities) {
      const color = color_map[entity.entity_group] || '#000000';
      let highlightedEntity = `<span style="background-color: ${color}; padding: 2px; border-radius: 3px;">
          ${entity.word}<sub>${entity.entity_group}</sub>
        </span>`;
      
      result = result.slice(0, entity.start) + highlightedEntity + result.slice(entity.end);
    }
    
    return result;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">金融术语命名实体识别 📈</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">输入金融语句文本</h2>
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="请输入需要进行命名实体识别的金融文本..."
        />
        
        <h3 className="text-lg font-semibold mb-2">金融术语类型</h3>
        <div className="mb-4">
          <label>
            <input
              type="checkbox"
              name="Macroeconomics"
              checked={termTypes.Macro}
              onChange={handleTermTypeChange}
            />
            宏观经济学
          </label>
          <label className="ml-4">
            <input
              type="checkbox"
              name="Securities and Capital Markets"
              checked={termTypes.SCM}
              onChange={handleTermTypeChange}
            />
            证券与资本市场
          </label>
          <label className="ml-4">
            <input
              type="checkbox"
              name="Investment Analysis and Trading"
              checked={termTypes.IAT}
              onChange={handleTermTypeChange}
            />
            投资分析与交易
          </label>
          <label className="ml-4">
            <input
              type="checkbox"
              name="Banking and Credit"
              checked={termTypes.BC}
              onChange={handleTermTypeChange}
            />
            银行与信贷
          </label>
          <label className="ml-4">
            <input
              type="checkbox"
              name="Financial Derivatives"
              checked={termTypes.FD}
              onChange={handleTermTypeChange}
            />
            金融衍生品
          </label>
          <label className="ml-4">
            <input
              type="checkbox"
              name="Financial Regulation and Institutions"
              checked={termTypes.FRI}
              onChange={handleTermTypeChange}
            />
            金融监管机构
          </label>
          <label className="ml-4">
            <input
              type="checkbox"
              name="allFinancialTerms"
              checked={termTypes.allFinancialTerms}
              onChange={handleTermTypeChange}
            />
            所有金融术语
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? '处理中...' : '识别实体'}
        </button>
      </div>
      {coloredResult && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">识别结果</h2>
          <div 
            dangerouslySetInnerHTML={{ __html: coloredResult }} 
            style={{
              lineHeight: '2',
              wordBreak: 'break-word'
            }}
          />
        </div>
      )}
      {result && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p className="font-bold">JSON 结果：</p>
          <pre>{result}</pre>
        </div>
      )}
      <div className="flex items-center text-yellow-700 bg-yellow-100 p-4 rounded-md">
        <AlertCircle className="mr-2" />
        <span>这是演示版本, 并非所有功能都可以正常工作。更多功能需要您来增强并实现。</span>
      </div>
    </div>
  );
};

export default FinnerPage;