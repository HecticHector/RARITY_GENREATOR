const Moralis = require('moralis/node');

const serverUrl = "https://ltnbpzs4ys3e.usemoralis.com:2053/server";
const appId = "RxdXmMTnyUDyWM8iBwyp8YrB8fnimO5tyJ6F0Aq7";
Moralis.start({ serverUrl, appId });

const resolveLink = (url) => {
    if (!url || !url.includes("ipfs://")) return url;
    return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");
};

const collectionAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
const collectionName = "BoredApeYachtClub";

async function generateRarity() {
    try {

        const NFTs = await Moralis.Web3API.token.getAllTokenIds({address: collectionAddress})

        // console.log(NFTs);
        const totalNum = NFTs.total;
        const pageSize = NFTs.page_size;
        console.log("totalNum" + totalNum )
        console.log("pageSize" + pageSize )
        let allNFTs = NFTs.result;

        // const timer = ms => new Promise(res => setTimeout(res, ms))

        // for(let i = pageSize; i < totalNum; i = i + pageSize) {
        //     const NFTs = await Moralis.Web3API.token.getAllTokenIds({ address: collectionAddress, offset: i });
        //     allNFTs = allNFTs.concat(NFTs.result);
        //     await timer(5000);
        // }

        // let metadata = allNFTs.map((e) => JSON.parse(e.metadata).attributes);
        let metadata = allNFTs.map((e) => JSON.parse(e.metadata).attributes);
        // console.log(metadata[0]);

        let tally = {"TraitCount":{}};

        for (let j = 0; j < metadata.length; j++) {
            let nftTraits = metadata[j].map((e) => e.trait_type);
            let nftValues = metadata[j].map((e) => e.value);

            let numOfTraits = nftTraits.length;

            if (tally.TraitCount[numOfTraits]) {
                tally.TraitCount[numOfTraits]++;
            } else {
                tally.TraitCount[numOfTraits] = 1;
            }

            // for (let i = 0; i < nftTraits.length; i++) {
            //     let current = nftTraits[i];
            //     if (tally[current]) {
            //         tally[current].occurences++;
            //     } else {
            //         tally[current] = { occurences: 1 };
            //     }
            // }

            for (let i = 0; i < nftTraits.length; i++) {
                let current = nftTraits[i];
                if (tally[current]) {
                    tally[current].occurences++;
                } else {
                    tally[current] = { occurences: 1 };
                }

                let currentValue = nftValues[i];
                if (tally[current] [currentValue]) {
                    tally[current][currentValue]++;
                } else {
                    tally[current][currentValue] = 1;
                }
            }
        }
    console.log("_____________tally_____________\n");
    console.log(tally)

    const collectionAttributes = Object.keys(tally);

    let nftArr = [];
    for (let j = 0; j < metadata.length; j++) {

        let current = metadata[j];
        let totalRarity = 0;

        for (let i = 0; i < current.length; i++) {
            let rarityScore =
              1 / (tally[current[i].trait_type][current[i].value] / totalNum);
            current[i].rarityScore = rarityScore;
            totalRarity += rarityScore;
        }

        let rarityScoreNumTraits =
          1 / (tally.TraitCount[Object.keys(current).length] / totalNum);
          current.push({
              trait_type: "TraitCount",
              value: Object.keys(current).length,
              rarityScore: rarityScoreNumTraits,
          });
          totalRarity += rarityScoreNumTraits;

          if (current.length < collectionAttributes.length) {
              let nftAttributes = current.map((e) => e.trait_type);
              let absent = collectionAttributes.filter(
                  (e) => !nftAttributes.includes(e)
              );

              absent.forEach((type) => {
                  let rarityScoreNull = 1 / ((totalNum - tally[type].occurences) / totalNum);
                  current.push({
                      trait_type: type,
                      value: null,
                      rarityScore: rarityScoreNull,
                  });
                  totalRarity += rarityScoreNull;
              });
          }

          if (allNFTs[j]?.metadata) {
              allNFTs[j].metadata = JSON.parse(allNFTs[j].metadata);
              allNFTs[j].image = resolveLink(allNFTs[j].metadata?.image);
          } else if (allNFTs[j].token_uri) {
              try {
                  await fetch(allNFTs[j].token_uri)
                    .then((response) => {
                        allNFTs[j].image = resolveLink(data.image);
                    });
              } catch (error) {
                console.log(error);
              }
          }
          nftArr.push({
              Attributes: current,
              Rarity: totalRarity,
              token_id: allNFTs[j].token_id,
              image: allNFTs[j].image,
          })
    }
    
    nftArr.sort((a, b) => b.Rarity - a.Rarity);

    for(let i = 0; i < nftArr.length; i++) {
        nftArr[i].Rank = i +1;
        const newClass = Moralis.Object.extend(collectionName);
        const newObject = new newClass();

        newObject.set("attributes", nftArr[i].Attributes);
        newObject.set("rarity", nftArr[i].rarity);
        newObject.set("tokenId", nftArr[i].tokenId);
        newObject.set("rank", nftArr[i].Rank);
        newObject.set("image", nftArr[i].image);

        await newObject.save();
        console.log(i);

    }

    console.log(metadata[0]);
    console.log("_____________tally_____________\n");
    console.log(nftArr);


    } catch(e) {
          console.log('______________NFTs_____________');
          console.log(e);
          console.log('______________NFTs_____________');
    }
};

generateRarity();