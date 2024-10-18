const puppeteer = require('puppeteer');
const fs = require('fs').promises;
let sequence=1;
let itemAdded=false;
const timeout = 1200000;
const timeout2 = 2000;
const suspendXpath = 'xpath///*[@id="workspace-footer"]/velocity-button/table/tbody/tr/td[3]/button';
const cancelXpath = 'xpath///*[@id="workspace-footer"]/velocity-button/table/tbody/tr/td[2]/button';
const skuFilePath = 'skus.json';
const enterBtn='xpath///*[@id="workspace-footer"]/velocity-button/table/tbody/tr/td[1]/button';
//const itemMenuBtn='xpath//html/body/entry-app/div/pos-app-shell/pos-layout/form/section/section/section/section/section/div/aside/vr-host/section[1]/item-list/item-container[1]/item/div/div/div/div[1]/div[3]/menu-launcher/button/i';
//const itemMenuBtn='item-container:nth-of-type(${sequence}) button';
const quantityBtn = 'xpath//html/body/ngb-modal-window/div/div/menu-host/menu-list/div[2]/div/div/div[3]/button';
const quantityTextbox = 'xpath///*[@id="posEntryInput"]';
const storeidDeviceIdFilePath = 'storeidDeviceId.json';
let deviceId=0;
let storeId=0;


async function main() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setDefaultTimeout(timeout);
    await setViewport(page);

    try {
		await setStoreidDeviceId(page);

        await login(page);	
        await processSkus(page);
		await new Promise(resolve => setTimeout(resolve, timeout2));
		console.log("added all items");

        // suspend
        await clickButton(page, suspendXpath);
		console.log("clicked suspend");
				await new Promise(resolve => setTimeout(resolve, timeout2));

        // await clickButton(page, totalXpath); // Add the correct totalXpath
    } catch (err) {
        console.error('Error in main execution:', err);
    } finally {
        await browser.close();
    }
}

async function setViewport(page) {
    await page.setViewport({
        width: 1500,
        height: 607,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: true
    });
}

async function login(page) {
	const url = `https://rtp-lib-reg30.corp.e3retail.com:44346/deviceId/autogenerate?tenant=910002&store=${storeId}&device=${deviceId}&type=3&appid=1001&tz=Eastern%20Standard%20Time&url=https%3A%2F%2Frtp-lib-reg30.corp.e3retail.com%3A44346`;

    await page.goto(url);

    await page.waitForSelector('#Username', { visible: true });
    await page.type('#Username', '45');
    await page.keyboard.press('Tab');
    await page.type('#Password', 'Test2222');
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    await page.waitForSelector('#workspaceInputs input', { visible: true });
    await page.click(cancelXpath, { visible: true });
}

async function setStoreidDeviceId(page) {
    const storeidDeviceIdData = await readstoreidDeviceId();
	deviceId=storeidDeviceIdData[0]["deviceId"];
		storeId=storeidDeviceIdData[0]["storeId"];	
}
 
async function readstoreidDeviceId() {
    const storeidDeviceIdData = await fs.readFile(storeidDeviceIdFilePath, 'utf8');	
    return JSON.parse(storeidDeviceIdData);
}

async function processSkus(page) {
    const skus = await readSkus();
	let Ean = '';
	let quantity = 1;
//let sequence=1;
    for (const sku of skus) {
		
		if(sku.includes('$'))
		{
			console.log('$');
		  let charIndex = sku.indexOf('$');
    Ean = sku.substring(0, charIndex);
	quantity = sku.substring(charIndex+1);
		}
		
		else{
						console.log('else');

			 Ean = sku;
			 quantity=1;
		}
		
		if(quantity>=1)
				{
		        await enterSku(page, Ean);
				itemAdded=true;
				}
				else
				{
				 itemAdded=false;
				}
				
				if(quantity>1 && quantity<1000)
				{		console.log(Ean);
					console.log('changeQty called');

		await changeQty(page,sequence,quantity);
				}				
				
        await new Promise(resolve => setTimeout(resolve, 4000)); // Adjust timeout as needed
		
		if(itemAdded)
		{
		sequence=sequence+1;
		}
    }	
}

async function readSkus() {
    const skuData = await fs.readFile(skuFilePath, 'utf8');
    return JSON.parse(skuData);
}

async function enterSku(page, sku) {
    await page.waitForSelector('#posEntryInput', { visible: true });
    await page.focus('#posEntryInput');
    await clearInput(page);
    
    for (const char of sku) {
        await page.type('#posEntryInput', char, { delay: 200 });
    }
    	//await new Promise(resolve => setTimeout(resolve, 60000));

 //  await page.click('xpath///*[@id="workspace-footer"]/velocity-button/table/tbody/tr/td[1]/button', { visible: true });
      await page.click(enterBtn, { visible: true });

}

async function changeQty(page,sequence,quantity) {
		await new Promise(resolve => setTimeout(resolve, timeout2));
		const itemMenuBtn=`item-container:nth-of-type(${sequence}) button`;

         await page.click(itemMenuBtn, { visible: true });
		 await page.click(quantityBtn, { visible: true });
		 		await new Promise(resolve => setTimeout(resolve, timeout2));

		 await page.type(quantityTextbox, quantity);
		 		await new Promise(resolve => setTimeout(resolve, timeout2));

         await page.click(enterBtn, { visible: true });

}

async function Isvisible() {
   await page.waitForSelector('#element', {
  visible: true,
})
}

async function clearInput(page) {
    await page.keyboard.down('Control'); // Use 'Meta' for Mac
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
}

async function clickButton(page, xpath) {
    await page.waitForSelector(xpath, { visible: true });
    await page.click(xpath);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
