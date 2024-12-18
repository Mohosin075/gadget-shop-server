export type TQuery = {
  title?: string | { $regex: string; $options: string };
  category?: string | { $regex: string; $options: string };
  brand?: string | { $regex: string; $options: string };
};
