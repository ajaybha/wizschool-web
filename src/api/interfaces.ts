interface IAttributeMetadata {
    trait_type?: string,
    value: string,
}
export interface IUserInfo {
    id:string,
    walletAddress:string,
    email?:string,
    walletTye?:string,
};

export interface ICollectionMetadata 
{
    name:string,
    description?:string,
    image?:string,
    external_link?:string
}
export interface IAssetInfo {
    tokenId: string,
    minted: boolean,
    ownerAddress: string,
    collectionAddress: string,
    name: string,
    description: string,
    image: string,
    external_url: string,
    attributes: IAttributeMetadata[],
}
export interface ISaleInfo {
    id:string,
    startTime:string,
    endTime:string,
    saleType:string,
    mintSupply: number,
    price: number,
    currencySymbol:string,
    currencyDecimals:number,    
    perWalletLimit: number,
    mintedCount: number,
    active:boolean,
    collectionAddress:string
};

export interface IUserWithAssetsInfo extends IUserInfo  {
    assets : IAssetInfo[],
};

