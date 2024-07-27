export function getGasless(
  relayerUrl?: string
) {
  return {
    gasless: relayerUrl
      ? {
          openzeppelin: { relayerUrl },
        }
      : undefined,
  };
}
