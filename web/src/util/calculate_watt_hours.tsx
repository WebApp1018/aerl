const wattHours = (
  wattData: Array<[number, string]>,
  stepSize: number
): number => {
  var wattDeltaT: Array<[number, number]> = [];
  for (let i = 1; i < wattData.length; i++) {
    wattDeltaT.push([
      wattData[i][0] - wattData[i - 1][0],
      parseInt(wattData[i][1]),
    ]);
  }

  const deltaTNotNull = wattDeltaT.filter((value) => value[0] < 2.5 * stepSize);
  var wattHours = 0;
  for (let i = 0; i < deltaTNotNull.length; i++) {
    wattHours += (deltaTNotNull[i][0] / 3600) * deltaTNotNull[i][1];
  }

  return wattHours;
};

export default wattHours;
