import { Unzipped, unzip } from "fflate";
import openapi from "./openapi.json";
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

export const mergeObjectsArray = <T extends { [key: string]: any }>(
  objectsArray: T[],
): T => {
  const result = objectsArray.reduce((previous, current) => {
    return { ...previous, ...current };
  }, {} as T);

  return result;
};

async function handleRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/openapi.json") {
    return Response.json(openapi);
  }

  const includeExt = url.searchParams.get("include-ext")?.split(",");
  const excludeExt = url.searchParams.get("exclude-ext")?.split(",");
  const excludeDir = url.searchParams.get("exclude-dir")?.split(",");

  const [_, owner, repo, branch] = url.pathname.split("/");
  const isJson = request.headers.get("accept") === "application/json";

  if (!owner) {
    return new Response(
      "You can use this API by going to /{owner}/{repository}/{branch}",
      { status: 404 },
    );
  }

  if (!repo) {
    return new Response("Please add your repository", { status: 404 });
  }

  if (!branch) {
    // for now, redirect to main always
    const newUrl = `${url.origin}/${owner}/${repo}/main`;
    return Response.redirect(newUrl, 302);
  }

  const apiUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;

  const response = await fetch(apiUrl);

  if (!response.ok || !response.body) {
    return new Response("Failed to fetch repository", {
      status: response.status,
    });
  }

  // Get the response as a readable stream
  const reader = response.body.getReader();

  // Create a stream to accumulate the binary data
  const chunks = [];
  let done, value;

  while ((({ done, value } = await reader.read()), !done)) {
    chunks.push(value);
  }

  // Concatenate all chunks into a single Uint8Array
  const zipData = new Uint8Array(
    chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), []),
  );

  // Use fflate to unzip the data
  const files = await new Promise<Unzipped>((resolve, reject) => {
    unzip(zipData, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  // Prepare the response data
  const fileContents: { [name: string]: string } = {};
  for (const [name, file] of Object.entries(files)) {
    const isUtf8 = isUtf8Encoded(file);
    if (isUtf8) {
      fileContents[name] = new TextDecoder("utf-8").decode(file);
    } else {
      fileContents[name] = "Binary or non-UTF-8 encoded data";
    }
  }

  // Do the filtering
  const filteredKeys = Object.keys(fileContents)
    .filter((path) => {
      if (!includeExt) {
        return true;
      }
      return includeExt.find((ext) => path.endsWith("." + ext));
    })
    .filter((path) => {
      if (!excludeExt) {
        return true;
      }
      return !excludeExt.find((ext) => path.endsWith("." + ext));
    })
    .filter((path) => {
      if (!excludeDir) {
        return true;
      }
      return !excludeDir.find((dir) => path.split("/").find((d) => d === dir));
    });

  if (isJson) {
    const json = filteredKeys.reduce(
      (previous, current) => ({
        ...previous,
        [current]: fileContents[current],
      }),
      {},
    );
    return Response.json(json);
  }

  const fileString = filteredKeys
    .map((path) => {
      return `${path}:\n-----------------------\n\n${fileContents[path]}`;
    })
    .join("\n\n-----------------------\n\n");
  return new Response(fileString);
}

function isUtf8Encoded(bytes: Uint8Array) {
  try {
    new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}
