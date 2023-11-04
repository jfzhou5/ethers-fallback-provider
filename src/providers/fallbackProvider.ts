import { ethers } from "ethers";
import { Networkish } from "@ethersproject/networks";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { DEBUG, sleep, requires } from "../utils";

export type FallbackProviderConfig = {
  fallbackTimeout?: number;
  maxRetryTime?: number;
  network?: Networkish;
};

const DEFAULT_MAX_RETRY_TIME = 5;
const DEFAULT_FALLBACK_TIMEOUT = 500;

export class JsonRpcFallbackProvider extends StaticJsonRpcProvider {
  private rpcs: string[];
  private config: FallbackProviderConfig;

  constructor(rpcs: string[], config?: FallbackProviderConfig) {
    requires(rpcs.length, "RPC Pool is empty");
    super(rpcs[0], config?.network);
    this.rpcs = rpcs;
    this.config = config
      ? {
          fallbackTimeout: DEFAULT_FALLBACK_TIMEOUT,
          maxRetryTime: rpcs.length * 5,
          ...config,
        }
      : {
          fallbackTimeout: DEFAULT_FALLBACK_TIMEOUT,
          maxRetryTime: rpcs.length * 5,
        };
  }

  randomRPC(): string {
    const index = Math.floor(Math.random() * this.rpcs.length);
    const url = this.rpcs[index];
    DEBUG && console.info(`Random new RPC: ${url}`);
    return url;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async send(method: string, params: Array<any>): Promise<any> {
    let retryTime = this.config.maxRetryTime || DEFAULT_MAX_RETRY_TIME;
    let url: string = "";
    while (retryTime > 0) {
      try {
        url = this.randomRPC();
        const provider = new ethers.providers.StaticJsonRpcProvider(url);
        return await provider.send(method, params);
      } catch (err) {
        DEBUG &&
          console.error(
            `RPC call error: ${url}, retry: ${retryTime}/${this.config.maxRetryTime}, ${err}`,
          );
        await sleep(this.config.fallbackTimeout || DEFAULT_FALLBACK_TIMEOUT);
        retryTime -= 1;
      }
    }
    throw Error("RPC call reach the limit...");
  }
}
