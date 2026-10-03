const express = require('express');
 const { getSales, getSaleById, createSale } = require('../controllers/salesController'); 

const { requireManagerOrDirector } = require('../middleware/authMiddleware'); 
  
  const router = express.Router();
 
 // ========================================= // SALES ROUTES // ========================================= 
 
 // Get all sales
  router.get( '/', requireManagerOrDirector, getSales ); 
  
  // Get one sale
   router.get( '/:id', requireManagerOrDirector, getSaleById ); 
   
   // Create new sale
    router.post( '/', requireManagerOrDirector, createSale ); 
    
  module.exports = router; 