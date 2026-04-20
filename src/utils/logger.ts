function Log(msg: string) {
  if (__DEV__) {
    console.log(msg);
  }
}

export default Log;
