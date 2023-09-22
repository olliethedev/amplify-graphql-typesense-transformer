import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import { Amplify } from "aws-amplify";
import config from "../aws-exports";
import { API } from "aws-amplify";
import * as mutations from "../graphql/mutations";
import * as queries from "../graphql/queries";
import { GraphQLQuery } from "@aws-amplify/api";
import { CreateBlogInput, SearchBlogsQuery, CreateBlogMutation, UpdateBlogInput, UpdateBlogMutation, DeleteBlogMutation, DeleteBlogMutationVariables, DeleteBlogInput } from "../API";
import { useState } from "react";

Amplify.configure(config);

export default function Home() {
  
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <CreateBlogLayout />
      <SearchBlogLayout />
      <UpdateBlogLayout />
      <DeleteBlogLayout />
    </main>
  );
}

const CreateBlogLayout = () => {

  const [input, setInput] = useState("");
  const [createResults, setCreateResults] = useState<String[]>();

  const createPost = async (text: string) => {
    const blogDetails: CreateBlogInput = {
      name: text,
    };

    const newTodo = await API.graphql<GraphQLQuery<CreateBlogMutation>>({
      query: mutations.createBlog,
      variables: { input: blogDetails },
    });
    console.log({ newTodo });
    setCreateResults([newTodo.data?.createBlog?.name ?? "none"]);
  };

  return (<div>
    <input
      type="text"
      style={{
        color: "#000",
      }}
      placeholder="Post name"
      value={input}
      onChange={(e) => {
        setInput(e.target.value);
      }}
    />
    <button
      className="button"
      onClick={(e) => {
        createPost(input);
      }}
    >
      Save
    </button>
    <ul>
      {createResults?.map((result, index) => (
        <li key={index}>{result}</li>
      ))}
    </ul>
  </div>)
}

const SearchBlogLayout = () => {
  const [searchResults, setSearchResults] = useState<String[]>();

  const [inputSearch, setInputSearch] = useState("");
  const searchPost = async (text: string) => {
    const results = await API.graphql<GraphQLQuery<SearchBlogsQuery>>({
      query: queries.searchBlogs,
      variables: {
        searchParameters: JSON.stringify({
          q: `*${text}*`,
          query_by: "name",
          // 'filter_by' : 'num_employees:>100',
          // 'sort_by'   : 'num_employees:desc'
        }),
      },
    });
    console.log({ results });
    setSearchResults([results.data?.searchBlogs ?? "none"]);
  };


  return(<div className="search-container">
  <input
    type="text"
    className="search-input"
    style={{
      color: "#000",
    }}
    placeholder="Search..."
    value={inputSearch}
    onChange={(e) => {
      setInputSearch(e.target.value);
    }}
  />
  <button
    className="search-button"
    onClick={(e) => {
      searchPost(inputSearch);
    }}
  >
    Search
  </button>
  <ul>
    {searchResults?.map((result, index) => (
      <li key={index}>{result}</li>
    ))}
  </ul>
</div>)
}

const UpdateBlogLayout = () => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState(1);
  const [updateResults, setUpdateResults] = useState<String[]>();

  const updatePost = async (id: string, name: string, version: number) => { 
    console.log({ id, name, version });
    const blogDetails: UpdateBlogInput = {
      id: id,
      name: name,
      _version: version, 
    };

    console.log({ blogDetails });

    const updatedBlog = await API.graphql<GraphQLQuery<UpdateBlogMutation>>({
      query: mutations.updateBlog,
      variables: { input: blogDetails },
    });
    console.log({ updatedBlog });
    setUpdateResults([updatedBlog.data?.updateBlog?.name ?? "none"]);
  };

  return (<div>
    <input
      type="text"
      style={{
        color: "#000",
      }}
      placeholder="Post ID"
      value={id}
      onChange={(e) => {
        setId(e.target.value);
      }}
    />
    <input
      type="text"
      style={{
        color: "#000",
      }}
      placeholder="Post name"
      value={name}
      onChange={(e) => {
        setName(e.target.value);
      }}
    />
    <input
      type="number"
      style={{
        color: "#000",
      }}
      placeholder="Post version"
      value={version}
      onChange={(e) => {
        setVersion(Number(e.target.value)); // Added input for version
      }}
    />
    <button
      className="button"
      onClick={(e) => {
        updatePost(id, name, version); // Added version to function call
      }}
    >
      Update
    </button>
    <ul>
      {updateResults?.map((result, index) => (
        <li key={index}>{result}</li>
      ))}
    </ul>
  </div>)
}

const DeleteBlogLayout = () => {
  const [id, setId] = useState("");
  const [version, setVersion] = useState(1);
  const [deleteResults, setDeleteResults] = useState<String[]>();

  const deletePost = async (id: string, version: number) => {
    const blogDetails: DeleteBlogInput = {
      id: id,
      _version: version,
    };

    const deletedBlog = await API.graphql<GraphQLQuery<DeleteBlogMutation>>({
      query: mutations.deleteBlog,
      variables: { input: blogDetails },
    });
    console.log({ deletedBlog });
    setDeleteResults([deletedBlog.data?.deleteBlog?.name ?? "none"]);
  };

  return (<div>
    <input
      type="text"
      style={{
        color: "#000",
      }}
      placeholder="Post ID"
      value={id}
      onChange={(e) => {
        setId(e.target.value);
      }}
    />
    <input
      type="number"
      style={{
        color: "#000",
      }}
      placeholder="Post version"
      value={version}
      onChange={(e) => {
        setVersion(Number(e.target.value)); // Added input for version
      }}
    />
    <button
      className="button"
      onClick={(e) => {
        deletePost(id, version); // Added version to function call
      }}
    >
      Delete
    </button>
    <ul>
      {deleteResults?.map((result, index) => (
        <li key={index}>{result}</li>
      ))}
    </ul>
  </div>)
}
