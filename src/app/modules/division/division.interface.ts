export interface IDivision {
  name: string;
  slug: string;
  thumbnail?: string;
  description?: string;
}

/**
 * division name = Chattogram Division
 * slug = chattogram-division
 * /:id => /6565sdfsdf4444w32
 * /:id =>  /division/6565sdfsdf4444w32
 * /:slug => /division/chattogram-division
 */
