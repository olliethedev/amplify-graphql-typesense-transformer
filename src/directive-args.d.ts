export interface FieldList {
    include?: [string];
    exclude?: [string];
  }
 export interface TypesenseDirectiveArgs {
    fields?: FieldList;
    settings?: string;
  }