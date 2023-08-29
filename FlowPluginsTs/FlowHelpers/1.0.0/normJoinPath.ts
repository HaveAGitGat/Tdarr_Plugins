const formatWindowsRootFolder = (path: string): string => {
  // Remove '.' from end of Windows root folder mapping e.g. 'E:.'
  if (
    path.length === 3
    && path.charAt(1) === ':'
    && path.charAt(2) === '.'
  ) {
    // eslint-disable-next-line no-param-reassign
    path = path.slice(0, -1);
  }

  return path;
};

const normJoinPath = ({
  upath,
  paths,
}:{
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upath: any,
  paths: string[]
}):string => {
  let path = upath.joinSafe(...paths);
  path = formatWindowsRootFolder(path);
  return path;
};

export default normJoinPath;
