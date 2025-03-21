### **Exercise1 : Environment Setup, Git Workflows & Hello MongoDB**

##### **Step 1: Install Development Tools**

1. **Install VSCode**  
   - ![Screenshot](images/image1.png)  
     Download from [code.visualstudio.com](https://code.visualstudio.com).  
   - ![Screenshot](images/image2.png)  
     Install recommended extensions: **MongoDB for VSCode**.  

2. **Install NodeJS & npm**  
   - ![Screenshot](images/image3.png)  
     Download the **LTS version** from [nodejs.org](https://nodejs.org).  
   - Verify installation using:  
   - ![Screenshot](images/image4.png)  

3. **Install MongoDB**  
   - ![Screenshot](images/image5.png)  
     Follow the download and installation guide and **start the service**.  

4. **Install Git**  
   - ![Screenshot](images/image6.png)  
     Download from [git-scm.com](https://git-scm.com).  
   - ![Screenshot](images/image7.png)  
     Configure **Git username/email**.  

5. **Install MongoDB Compass (Optional)**  
   - ![Screenshot](images/image8.png)  
     Download from [MongoDB Compass](https://www.mongodb.com/try/download/compass). 

##### **Step 2: Git Basics & Repository Setup**

1. **Create a GitHub Account**  
   - ![Screenshot](images/image9.png)  
     Create an account using your **student email**.  
   - ![Screenshot](images/image14.png)  
     Create a **new Git Repository**.  

2. **Create a README.md File**  
   Document your installation steps.  
   - ![Screenshot](images/image14.png)  
     Create a **new Git Repository**.  

3. **Commit and Push to GitHub**  
   ```sh
   git add .
   git commit -m "Initial commit: Setup Documentation"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git  # Replace with your repo link
   git push -u origin main

##### **Step 3: Create a "Hello MongoDB" NodeJS Script**

1. **Initialize a NodeJS Project**  
   - ![Screenshot](images/image15.png)  

2. **Install MongoDB Driver**  
   - ![Screenshot](images/image16.png)  

3. **Create `index.js`**  
   - ![Screenshot](images/image10.png)  

4. **Run the Script**  
   ```sh
   node index.js

##### **Step 4: Push Code to GitHub**  

1. **Create a `.gitignore` file**  

2. **Add `node_modules` to the `.gitignore` file**  
   - ![Screenshot](images/image13.png)  

3. **Commit and Push Changes**  
   ```sh
   git add .
   git commit -m "Add NodeJS script and MongoDB connection"
   git push -u origin main