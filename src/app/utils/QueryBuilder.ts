/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Query } from "mongoose";
import { excludeField } from "../constants";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // location = Dhaka (Filtering is, Exact match)
  // search = Golf (Searching is, Partial match)
  // Filter method
  // This method will filter the model based on the query parameters
  filter(): this {
    const filter = { ...this.query };

    // exclude searchTerm and sort from filter otherwise it will be used in the query
    for (const field of excludeField) {
      delete filter[field];
    }

    this.modelQuery = this.modelQuery.find(filter);

    return this;
  }

  // Search method
  // This method will search the model based on the searchable fields
  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm || "";

    const searchQuery = {
      $or: searchableFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: "i" },
      })),
    };
    this.modelQuery = this.modelQuery.find(searchQuery);
    return this;
  }

  //sort method
  // This method will sort the model based on the query parameters
  sort(): this {
    const sort = this.query.sort || "createdAt";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  //fields method
  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  //Pagination method
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // Build method will return the final query
  build() {
    return this.modelQuery;
  }

  // Get Meta data
  async getMeta() {
    // const totalTours = await Tour.countDocuments();
    // const totalPage = Math.ceil(totalTours / limit); // 11/10 = 1.1 => ciel(1.1) => 2
    const totalDocuments = await this.modelQuery.model.countDocuments();
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPages,
    };
  }
}
