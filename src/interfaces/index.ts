export interface DataRow {
  type: string;
  created_at: string;
  model: string;
  usage_input: number;
  usage_output: number;
}

export interface CostRow {
  model: string;
  input: number;
  output: number;
}

export interface TotalCost {
  date: string;
  cost: number;
}
