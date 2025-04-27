const express = require('express');
const app = express();
const port = 8801;

app.use("/",(req,res)=>{
    res.json({message:"first step of the final project"})
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  