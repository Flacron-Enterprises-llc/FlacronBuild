class dashboardLocation{
    
    //Locators

    weblocators={

 ///step2
       location: '.text-lg.font-medium.text-neutral-800',
       step2: '.text-sm.text-neutral-500',
       locationDetectedFail: '.grid > .font-semibold',
       locationDetected: '.text-sm.font-semibold',
       countryError: 'p[id=":r3i:-form-item-message"]',
       cityError: 'p[id=":r3j:-form-item-message"]',
       zcodeError: '#\\:r12\\:-form-item-message',
       country: '[name="location.country"]',
       city: '[name="location.city"]',
       zipCode: '[name="location.zipCode"]',
       title: '.text-lg.font-medium.text-neutral-800',
       invalidImgError: '.text-sm.opacity-90',
       uploadedName: '.mt-2 > .flex > span',
       removeLink: '.text-red-500',
       imgError: '.grid > .font-semibold',
       preButton: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"]',
       //optional upload
       upload: '.mt-6 > .flex > .inline-flex',
       //max 10MB
       locationMap: '.block.text-sm.font-medium.text-gray-700',
       deceteMyLocation: 'button[class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 text-xs"]',
       nextButton: 'body > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > form:nth-child(2) > div:nth-child(2) > div:nth-child(2) > button:nth-child(1)',
        

    }


  //Methords

  
  enterCountry(CName){

    cy.get(this.weblocators.country).clear()
    cy.get(this.weblocators.country).type(CName).as('country')
    

  }
validateLocationDetection() {

  //  FAIL CASE – location not detected
  cy.get('body').then(($body) => {

    if ($body.find('.grid > .font-semibold').length > 0) {

      cy.get('.grid > .font-semibold')
        .invoke('text')
        .then((failMsg) => {
          throw new Error(
            `Test FAILED: Location detection failed.
Message displayed: "${failMsg.trim()}"`
          );
        });
    }

    //  Neither message found
    else {
      throw new Error(
        'Test FAILED: No location detection message was displayed.'
      );
    }
  });
}

  
  varifyUploadImage(){

      cy.get(this.weblocators.uploadedName).should('contain','roof img.jpg')
    

  }

  
  enterCity(CityName){

    cy.get(this.weblocators.city).clear()
    cy.get(this.weblocators.city).type(CityName).as('city')
    

  }


  
  enterZipCode(ZCode){

    cy.get(this.weblocators.zipCode).clear('1').type(ZCode)
    

  }

  
    validateSteps(){

    cy.get(this.weblocators.step2).should('be.visible').and('contain','Step 2 / 6')
    

  }

  
  validateMyLocation(){

    cy.get(this.weblocators.deceteMyLocation).click()
    

  }

  detectAndValidateLocation() {

  // 1 Click "Detect my location"
  cy.get(this.weblocators.deceteMyLocation)
    .should('be.visible')
    .click();

  // 2 Wait for map to react (marker / map loaded)
  // Adjust selector if you have a specific marker
  cy.get(this.weblocators.locationMap, { timeout: 15000 })
    .should('be.visible');

  // 3 Detect which popup is visible
  cy.get('body', { timeout: 15000 }).then(($body) => {

    const detectedPopupVisible =
      $body.find(`${this.weblocators.locationDetected}:visible`).length > 0;

    const failedPopupVisible =
      $body.find(`${this.weblocators.locationDetectedFail}:visible`).length > 0;

    //  Location detected → PASS
    if (detectedPopupVisible) {
      cy.log(' Location detected successfully');
      cy.get(this.weblocators.locationDetected)
        .should('be.visible');
    }

    //  Location not detected → FAIL
    else if (failedPopupVisible) {
      cy.log(' Location detection failed');
      cy.get(this.weblocators.locationDetectedFail)
        .should('be.visible');

      throw new Error('Location was NOT detected');
    }

    // Unexpected state
    else {
      throw new Error('No visible location detection popup found');
    }
  });
}


  
    validateTitle(){

    cy.get(this.weblocators.title).should('be.visible').and('contain','Location')
    
    

  }

  uploadValidImage(){

cy.get('div.border-dashed').click({ force: true })
cy.fixture('home.png').as('png')
cy.get('input[type="file"]').selectFile('@png', { force: true })
 cy.contains('home.png').should('be.visible')

   

  }

 uploadInvaidImageFile() {

  cy.get('div.border-dashed').click({ force: true })
  cy.fixture('test.mp4').as('mp4')
  cy.get('input[type="file"]').selectFile('@mp4', { force: true })
  cy.wait(300)

cy.get('.file-error-message').should('be.visible')



}
  
  uploadInvaidImageSize(){

    
  cy.get('div.border-dashed').click({ force: true })
  cy.fixture('11.jpg').as('jpg')
  cy.get('input[type="file"]').selectFile('@jpg', { force: true })
  cy.wait(300)

  
cy.get(this.weblocators.imgError).should('be.visible').and('contain','File size limit exceeded')

    

  }

  
  vaidateImgRemoveLink(){

  // 1. Upload image
  cy.fixture('home.png').as('png')
  cy.get('input[type="file"]').selectFile('@png', { force: true })

  // 2. Verify uploaded file name is displayed
  cy.contains('home.png').should('be.visible')

  // 3. Click remove/remove link
  cy.contains('Remove').click({ force: true })

  // 4. Verify file name is no longer visible → deleted
  cy.contains('home.png').should('not.exist')
}



  vaidateUpoadMultipleImages(){

cy.get('div.border-dashed').click({ force: true })
cy.fixture('roof img.jpg').as('jpg')
cy.get('input[type="file"]').selectFile('@jpg', { force: true })
 cy.contains('roof img.jpg').should('be.visible')

  cy.wait(200)

  // 2. Verify uploaded file name is displayed


cy.get('div.border-dashed').click({ force: true })
cy.fixture('home.png').as('png')
cy.get('input[type="file"]').selectFile('@png', { force: true })
 cy.contains('home.png').should('be.visible')
  cy.wait(500)
 

}



  vaidateUploadImage10MB(){

  // 1. Upload image
  cy.fixture('10.jpg').as('jpg')
  cy.get('input[type="file"]').selectFile('@jpg', { force: true })

  // 2. Verify uploaded file name is displayed
  cy.contains('10.jpg').should('be.visible')



}

  

  
  validateZipcodeError(){

    cy.get(this.weblocators.zipCode).clear()
    cy.get(this.weblocators.nextButton).click()
    cy.contains('ZIP code is required').should('be.visible').and('contain','ZIP code is required')
  //  cy.get(this.weblocators.zcodeError).should('be.visible').and('contain','ZIP code is required')
    

  }

  
  
  varifyPreviousButton(){

    cy.get(this.weblocators.preButton).click()
    cy.get(this.weblocators.step2).should('contain','Step 1 / 6')

  }

    clickNextButton(){

    cy.get(this.weblocators.nextButton).click()
    cy.wait(1000)
   // cy.get(this.weblocators.step2).should('contain','Step 3 / 6')
    

  }


    validateStep3(){

    cy.get(this.weblocators.step2).should('contain','Step 3 / 6')
    

  }
  
    validateStep2(){

    cy.get(this.weblocators.step2).should('contain','Step 2 / 6')
    

  }

 
    
}

export default dashboardLocation;