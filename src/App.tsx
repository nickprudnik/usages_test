import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
} from 'recharts';
import { usageModels, usageTypes } from './utils';
import { CostRow, DataRow, TotalCost } from './interfaces';

const App: React.FC = () => {
  const [usages, setUsages] = useState<DataRow[]>([]);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [totalCosts, setTotalCosts] = useState<TotalCost[]>([]);
  const [filteredUsagesData, setFilteredUsagesData] =
    useState<DataRow[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');

  useEffect(() => {
    const fetchCSV = async <T,>(
      url: string,
      setFunction: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const response = await fetch(url);
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('Failed to get response');
        return;
      }
      const result = await reader.read();
      const decoder = new TextDecoder('utf-8');
      const csv = decoder.decode(result.value);
      Papa.parse<T>(csv, {
        header: true,
        complete: (results) => setFunction(results.data),
        error: (error: Error) => console.error('CSV Error parsing:', error),
      });
    };

    fetchCSV<DataRow>('/usages.csv', setUsages);
    fetchCSV<CostRow>('/costs.csv', setCosts);
  }, []);

  const filterUsagesData = () => {
    let filteredData = usages;

    if (selectedType !== 'all') {
      filteredData = filteredData.filter(
        (usage) => usage.type === selectedType
      );
    }

    if (selectedModel !== 'all') {
      filteredData = filteredData.filter(
        (usage) => usage.model === selectedModel
      );
    }

    setFilteredUsagesData(filteredData);
  };

  useEffect(() => {
    if (usages.length && costs.length) {
      filterUsagesData();
    }
  }, [usages, costs, selectedType, selectedModel]);

  const calculateUsagesTotalCost = () => {
    const costsMap = new Map<
      string,
      { input_cost: number; output_cost: number }
    >();
    costs.forEach((cost) =>
      costsMap.set(cost.model, {
        input_cost: cost.input,
        output_cost: cost.output,
      })
    );

    const dailyCosts = new Map<string, number>();

    filteredUsagesData.forEach((usage) => {
      const cost = costsMap.get(usage.model);
      if (cost) {
        const totalCost =
          usage.usage_input * cost.input_cost +
          usage.usage_output * cost.output_cost;

        const [day, month, year] = usage.created_at.split('.');
        const formattedDateString = `${year}-${month}-${day}`;
        const date = formattedDateString;

        if (dailyCosts.has(date)) {
          dailyCosts.set(
            date,
            parseFloat((dailyCosts.get(date)! + totalCost).toFixed(2))
          );
        } else {
          dailyCosts.set(date, parseFloat(totalCost.toFixed(2)));
        }
      }
    });

    setTotalCosts(
      Array.from(dailyCosts.entries())
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  };

  useEffect(() => {
    calculateUsagesTotalCost();
  }, [filteredUsagesData]);

  return (
    <div className="container mx-auto px-4 py-6">
      {' '}
      <h1 className="text-2xl font-bold mb-4">Usages Daily Costs</h1>{' '}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {' '}
        <div className="flex flex-col md:flex-row gap-4">
          {' '}
          <div className="flex flex-col">
            {' '}
            <label htmlFor="typeFilter" className="mb-2 font-semibold">
              Filter by Type:
            </label>{' '}
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              {' '}
              {usageTypes && usageTypes.length > 0 ? (
                <>
                  {usageTypes.map((type) => (
                    <option key={type.name + type.value} value={type.value}>
                      {type.name}
                    </option>
                  ))}
                </>
              ) : null}
            </select>{' '}
          </div>{' '}
          <div className="flex flex-col">
            {' '}
            <label htmlFor="modelFilter" className="mb-2 font-semibold">
              Filter by Model:
            </label>{' '}
            <select
              id="modelFilter"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              {usageModels && usageModels.length > 0 ? (
                <>
                  {usageModels.map((type) => (
                    <option key={type.name + type.value} value={type.value}>
                      {type.name}
                    </option>
                  ))}
                </>
              ) : null}
            </select>{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
      <div className="w-full">
        {' '}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={totalCosts}
            margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
          >
            {' '}
            <CartesianGrid strokeDasharray="3 3" />{' '}
            <XAxis dataKey="date">
              {' '}
              <Label value="Date" offset={-30} position="insideBottom" />{' '}
            </XAxis>{' '}
            <YAxis>
              {' '}
              <Label
                value="Costs"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }}
              />{' '}
            </YAxis>{' '}
            <Tooltip wrapperStyle={{backgroundColor: "lightblue"}}/>{' '}
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />{' '}
          </LineChart>
        </ResponsiveContainer>{' '}
      </div>{' '}
    </div>
  );
};

export default App;
