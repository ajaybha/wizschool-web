import {
  ConnectWallet,
  useAddress,
  useContract,
  Web3Button,
} from "@thirdweb-dev/react";
import { BigNumber, ethers, utils } from "ethers";
import { useMemo, useState } from "react";
import { HeadingImage } from "./components/HeadingImage";
import { PoweredBy } from "./components/PoweredBy";
import { useToast } from "./components/ui/use-toast";
/** 
 * api hooks for integrating with backend
 */
import {
  useSalesApi, 
  useCollectionMetadataApi, 
  useActiveSaleApi,
  useActiveUserApi
} from "./api";

import { 
  clientIdConst,
  wizschoolApiBaseUrl,
  primaryColorConst,
  themeConst,
} from "./consts/parameters";

import {
  collectionContractConst,
  saleMinterContractConst,
  saleMinterContractABI,
} from "./consts/contract";

const urlParams = new URL(window.location.toString()).searchParams;
const collectionContractAddr = urlParams.get("contract") || collectionContractConst || "";
const saleMinterContractAddr = urlParams.get("salecontract") || saleMinterContractConst || "";
const primaryColor =
  urlParams.get("primaryColor") || primaryColorConst || undefined;

const colors = {
  purple: "#7C3AED",
  blue: "#3B82F6",
  orange: "#F59E0B",
  pink: "#EC4899",
  green: "#10B981",
  red: "#EF4444",
  teal: "#14B8A6",
  cyan: "#22D3EE",
  yellow: "#FBBF24",
} as const;

const apiEndpoints = {

  assets: "api/assets",
  singleAsset: "api/asset",

  collections: "api/collections",
  singleCollection: "api/collection",

  sales: "api/sales",
  singleSale: "api/sale",

  users: "api/users",
  singleUser: "api/user",

};

export default function Home() {
  console.log("Inside App Home()");

  const { toast } = useToast();
  let theme = (urlParams.get("theme") || themeConst || "light") as
    | "light"
    | "dark"
    | "system";
  if (theme === "system") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  const root = window.document.documentElement;
  root.classList.add(theme);

  const contractAddressLower = collectionContractAddr.toLowerCase();
  const saleContractQuery = useContract(saleMinterContractAddr, saleMinterContractABI);
  
  /**
   * get metadata given contract/collection -- same as contractURI endpoint returned from the smartcontract
   */
  
  console.log(`useCollectionMetadataApi: ${apiEndpoints.singleCollection}/${contractAddressLower}/metadata`);
  const contractMetadata = useCollectionMetadataApi(`${apiEndpoints.singleCollection}/${contractAddressLower}/metadata`);
  /**
   * get all the sales for given contract/collection 
   */
  console.log(`useSalesApi: ${apiEndpoints.sales}?collection=${contractAddressLower}`);
  const allSalesInfo = useSalesApi(`${apiEndpoints.sales}?collection=${contractAddressLower}`);
  /**
   * get the active sale for given contract/collection 
   * active here means status:active, current time falling under sale window & most recent start time
   */
  console.log(`useSalesApi: ${apiEndpoints.singleSale}?collection=${contractAddressLower}`);
  const activeSaleInfo = useActiveSaleApi(`${apiEndpoints.singleSale}?collection=${contractAddressLower}`);

  
  const walletAddress = useAddress();
  const [quantity, setQuantity] = useState(1);

  /**
   * get the active user and all its assets
   */
  const activeUserApiPath = `${apiEndpoints.singleUser}/${walletAddress?.toLowerCase()}/assets/?collection=${contractAddressLower}`;
  console.log(`useActiveUserApi: ${activeUserApiPath}`);
  const activeUserInfo = useActiveUserApi(`${activeUserApiPath}`);  

  /**
   * calculate princeToMint
   */
  const priceToMint = useMemo(() => {
    //const bnPrice = BigNumber.from(
      //activeClaimCondition.data?.currencyMetadata.value || 0,
    //);
    // BigNumber is not supported in very many database systems. We are storing the 
    // price in ether units (not gwei)
    const bnPrice:BigNumber = utils.parseEther(activeSaleInfo.data?.price.toString() || "0");
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeSaleInfo.data?.currencyDecimals || 18,
    )} ${activeSaleInfo.data?.currencySymbol}`;
  }, [
    activeSaleInfo.data?.currencyDecimals,
    activeSaleInfo.data?.currencySymbol,
    activeSaleInfo.data?.price,
    quantity,
  ]);

  /**
   * total available supply to mint (during this sale)
   */
  const availableToMint: number = useMemo(() =>{
    let totalAvailable: BigNumber;
    // total mint supply - already-minted
    totalAvailable = BigNumber.from(activeSaleInfo.data?.mintSupply || 0).sub(activeSaleInfo.data?.mintedCount || 0);
    totalAvailable =  totalAvailable.lte(ethers.constants.Zero) ? ethers.constants.Zero: totalAvailable;
    return totalAvailable.toNumber();
  },[activeSaleInfo.data?.mintSupply, activeSaleInfo.data?.mintedCount]);

  /**
   * tokens minted by user 
   */
  const userMintedCount: number = useMemo(() => {
    return BigNumber.from(activeUserInfo.data?.assets.length || 0).toNumber();
  }, [activeUserInfo.data?.assets]);

  /**
   * get first nft metadata
   */
  const firstNft  = useMemo(()=>{
    let nftCount = activeUserInfo.data?.assets.length || 0;
    if(nftCount > 0) {
      return activeUserInfo.data?.assets[0];
    }
    return undefined;
  }, [activeUserInfo.data?.assets]);
  
  /**
   * available supply to mint for user
   */
  const availToMintByUser = useMemo(() => {
    let availableToMintByUser : BigNumber;   
    availableToMintByUser = BigNumber.from(activeSaleInfo.data?.perWalletLimit || 0).sub(userMintedCount);
    // check against total available supply for the sale
    if(availableToMintByUser.lte(availableToMint)) {
      availableToMintByUser = availableToMintByUser.lt(ethers.constants.Zero) ? ethers.constants.Zero : availableToMintByUser;      
    }
    else {
      availableToMintByUser = BigNumber.from(availableToMint);
    }
    return availableToMintByUser.toNumber();
  }, [availableToMint, userMintedCount, activeSaleInfo.data?.perWalletLimit]);

  /**
   * soldout condition
   */
  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeSaleInfo.success && availableToMint <= 0)
      );
    } catch (e) {
      return false;
    }
  }, [availableToMint,activeSaleInfo.success]);//,numberClaimed,numberTotal]);

  const canClaim = useMemo(() => { 
    return (activeSaleInfo.success && !isSoldOut && availToMintByUser > 0);
  }, [activeSaleInfo.success, isSoldOut, availToMintByUser]);

  /**********************************************************
   * Rendering logic starts from here
   * ***********************************************************/
  // how many current wallet user has minted
  const numberMintedStr = useMemo(() => {
    return userMintedCount.toString();
  }, [userMintedCount]);

  // how many are available (for the sale)
  const numberTotalStr = useMemo(() => {
    return availableToMint.toString();
  }, [availableToMint]);

  // how many days/hours for sale to finish
  const timeRemainingStr = useMemo(() => {
    if(activeSaleInfo.success && activeSaleInfo.data?.endTime && !isSoldOut) {
      let cd:Date = new Date();
      const et:Date = new Date(activeSaleInfo.data?.endTime);
      const _ms_per_day = 1000*60*60*24;
      const utc1 = Date.UTC(cd.getFullYear(), cd.getMonth(), cd.getDate());
      const utc2 = Date.UTC(et.getFullYear(), et.getMonth(), et.getDate());
      const daysDiff = (utc2 - utc1)/_ms_per_day;
      if(daysDiff > 3) {
        return `Days left: ${daysDiff}`
      }
      else return `Hurry, ${daysDiff * 24} hours left`;
    }
  }, [activeSaleInfo.data, isSoldOut, activeSaleInfo.success]);

  /**
   * isLoading hook to check loading conditions
   */
  const isLoading = useMemo(() => {
    return (
      activeSaleInfo.loading ||
      activeUserInfo.loading ||
      !saleContractQuery.contract
    );
  }, [activeSaleInfo.loading, activeUserInfo.loading, saleContractQuery.contract,]);

  /**
   * Button Loading condition
   */
  const buttonLoading = useMemo(() => isLoading,[isLoading],);

  /**
   * what to show in mintbutton
   */
  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }
    if (canClaim) {
      // BigNumber is not supported in very many database systems. We are storing the 
      // price in ether units (not gwei)
      const pricePerToken:BigNumber = utils.parseEther(activeSaleInfo.data?.price.toString() || "0");
      if (pricePerToken.eq(0)) {
        return "Mint (Free)";
      }
      return `Mint (${priceToMint})`;
    }    
    if (buttonLoading) {
      return "Checking...";
    }
    if (!canClaim && availToMintByUser === 0)
    {
      return "Wallet limit reached"
    }
    return "Minting not available";
  }, [isSoldOut,canClaim, buttonLoading,activeSaleInfo.data?.price,priceToMint,availToMintByUser,]);

  /**
   * For all scheduled & active sales 
   * IF 
   * - there are no sales
   * - there is no_active_sale | mint_supply == 0 | end_time in past
   */
  const saleNotReady = useMemo(
    () => 
      allSalesInfo.data?.length === 0 ||
      allSalesInfo.data?.every((s) => s.active == false || s.mintSupply == 0 || new Date(s.endTime) < new Date()),
    [allSalesInfo.data]);

  /**
   * For all scheduled & active sales 
   * IF 
   * - there are some sales 
   * - there is at least one sale with active_sale && mint_supply >= 0 && start_time in future
   */
  const saleStartingSoon = useMemo(
    () => 
      (allSalesInfo.data && allSalesInfo.data.length > 0 && activeSaleInfo.error &&
      allSalesInfo.data?.some((s) => s.active == true && s.mintSupply > 0 && new Date(s.startTime) > new Date())) ||
      (activeSaleInfo.data && new Date(activeSaleInfo.data.startTime) > new Date()), 
    [allSalesInfo.data, activeSaleInfo.error, activeSaleInfo.data]);

  /**
   * check clientID and show message
   */
  const clientId = urlParams.get("clientId") || clientIdConst || "";
  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-full">
        Client ID is required as a query param to use this page.
      </div>
    );
  }

  /**
   * check contract address and show message
   */
  if (!saleMinterContractAddr) {
    return (
      <div className="flex items-center justify-center h-full">
        No contract address provided
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen">
      <ConnectWallet className="!absolute !right-4 !top-4" theme={theme} />
      <div className="grid h-screen grid-cols-1 lg:grid-cols-12 lg:border lg:border-gray-400 lg:dark:border-red-800">
        <div className="items-center justify-center hidden w-full h-full lg:col-span-5 lg:flex lg:px-12 lg:border lg:border-gray-400 lg:dark:border-yellow-800">
          <HeadingImage
            src={ firstNft?.image ||contractMetadata.data?.image ||"src/immutable-logo.svg"}
            isLoading={isLoading}
          />
        </div>
        <div className="flex items-center justify-center w-full h-full col-span-1 lg:col-span-7 lg:border lg:border-gray-400 lg:dark:border-green-800">
          <div className="flex flex-col w-full max-w-xl gap-4 p-12 rounded-xl lg:border lg:border-gray-400 lg:dark:border-yellow-800">
            <div className="flex w-full mt-8 xs:mb-8 xs:mt-0 lg:hidden">
              <HeadingImage
                src={ firstNft?.image || contractMetadata.data?.image ||"src/logo.svg"}
                isLoading={isLoading}
              />
            </div>

            <div className="saleinfo-div flex flex-col gap-2 xs:gap-4 lg:border lg:border-gray-400 lg:dark:border-green-800">
              {
                isLoading ? (
                <div
                  role="status"
                  className="space-y-8 animate-pulse md:flex md:items-center md:space-x-8 md:space-y-0"
                >
                  <div className="w-full">
                    <div className="w-24 h-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  </div>
                </div>
                ) : (
                  <p>
                    <span className="saleinfo-span text-lg font-bold tracking-wider text-gray-500 xs:text-xl lg:text-2xl">
                      {numberMintedStr}
                    </span>{" "}
                    <span className="saleinfo-span text-lg font-bold tracking-wider xs:text-xl lg:text-2xl">
                      / {numberTotalStr} minted
                    </span>
                    <span className="saleinfo-span-time text-lg font-bold tracking-wider text-gray-500 xs:text-xl lg:text-2xl justify-right">
                      {timeRemainingStr}
                    </span>
                  </p>
                )
              }
              <h1 className="text-2xl font-bold line-clamp-1 xs:text-3xl lg:text-4xl">
                {contractMetadata.isLoading ? (
                  <div
                    role="status"
                    className="space-y-8 animate-pulse md:flex md:items-center md:space-x-8 md:space-y-0"
                  >
                    <div className="w-full">
                      <div className="w-48 h-8 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    </div>
                    <span className="sr-only">Loading...</span>
                  </div>
                ) : (
                  contractMetadata.data?.name
                  //<span>Magical Broom for Wizschool</span>
                )}
              </h1>
              {
                contractMetadata.data?.description ||
                contractMetadata.isLoading ? (
                
                  <div className="text-gray-500 line-clamp-2">
                  {
                    contractMetadata.isLoading ? (
                      <div
                        role="status"
                          className="space-y-8 animate-pulse md:flex md:items-center md:space-x-8 md:space-y-0"
                      >
                        <div className="w-full">
                          <div className="mb-2.5 h-2 max-w-[480px] rounded-full bg-gray-200 dark:bg-gray-700"></div>
                          <div className="mb-2.5 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <span className="sr-only">Loading...</span>
                      </div>
                    ) 
                    : (
                    contractMetadata.data?.description
                    //<span>A magical brooms collection for the high flyers, players, explorers, scientists and other Wizards of the Wizschool and this text goes on and on and on and on and on and ond</span>
                  )}
                </div>
                ) : null
              }
            </div>
            <div className="flex w-full gap-4 lg:border lg:border-gray-400 lg:dark:border-blue-800">
              {
              saleNotReady 
                ? (
                  <span className="text-red-500">
                    There is no qualified token sale planned. Stay tuned! 
                  </span>
                ) 
                : saleStartingSoon 
                  ? (
                    <span className="text-gray-500">
                      Sale will be starting soon. Please check back later.
                    </span>
                  ) 
                  : (
                      <div className="flex flex-col w-full gap-4">
                        <div className="flex flex-col w-full gap-4 lg:flex-row lg:items-center lg:gap-4 ">
                          <div className="flex w-full px-2 border border-gray-400 rounded-lg h-11 dark:border-green-800 md:w-full">
                            <button
                              onClick={() => {
                                const value = quantity - 1;
                                if (value > availToMintByUser) {
                                  setQuantity(availToMintByUser);
                                } else if (value < 1) {
                                  setQuantity(1);
                                } else {
                                  setQuantity(value);
                                }
                              }}
                                  className="flex items-center justify-center h-full px-2 text-2xl text-center rounded-l-md disabled:cursor-not-allowed disabled:text-gray-500 dark:text-white dark:disabled:text-gray-600"
                              disabled={isSoldOut || quantity - 1 < 1}
                            >
                              -
                            </button>
                            <p className="flex items-center justify-center w-full h-full font-mono text-center dark:text-white lg:w-full">
                              {!isLoading && isSoldOut ? "Sold Out" : quantity}
                            </p>
                            <button
                              onClick={() => {
                                const value = quantity + 1;
                                if (value > availToMintByUser) {
                                  setQuantity(availToMintByUser);
                                } else if (value < 1) {
                                  setQuantity(1);
                                } else {
                                  setQuantity(value);
                                }
                              }}
                              className={
                                "flex h-full items-center justify-center rounded-r-md px-2 text-center text-2xl disabled:cursor-not-allowed disabled:text-gray-500 dark:text-white dark:disabled:text-gray-600"
                              }
                              disabled={isSoldOut || quantity + 1 > availToMintByUser}
                            >
                              +
                            </button>
                          </div>
                          <Web3Button
                            style={{
                              backgroundColor:
                                colors[primaryColor as keyof typeof colors] ||
                                primaryColor,
                              maxHeight: "43px",
                            }}                            
                            isDisabled={!canClaim || buttonLoading}
                            theme={theme}
                            contractAddress= {saleContractQuery.contract?.getAddress() || saleMinterContractAddr}
                            action={(cntr) => cntr.call("mint", [10], 
                              {
                                value: ethers.utils.parseEther("0.03")
                              })}
                            contractAbi={saleMinterContractABI}
                            onError={(err) => {
                              console.error(err);
                              console.log({ err });
                              toast({
                                title: "Failed to mint drop",
                                description: (err as any).reason || "",
                                duration: 9000,
                                variant: "destructive",
                              });
                            }}
                            onSuccess={() => {
                              toast({
                                title: "Successfully minted",
                                description:
                                  "The NFT has been transferred to your wallet",
                                duration: 5000,
                                className: "bg-green-500",
                              });
                            }}
                          >
                            {
                              buttonLoading 
                              ? (
                                <div role="status">
                                  <svg
                                    aria-hidden="true"
                                        className="w-4 h-4 mr-2 text-gray-200 animate-spin fill-blue-600 dark:text-gray-600"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                      fill="currentFill"
                                    />
                                  </svg>
                                  <span className="sr-only">Loading...</span>
                                </div>
                                ) 
                              : (
                              buttonText
                            )}
                          </Web3Button>
                        </div>
                      </div>
                    )
              }
            </div>
          </div>
        </div>
      </div>
      <PoweredBy />
    </div>
  );
}
