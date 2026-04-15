# Netgroup Website Data Management

This website is designed so that its content can be modified easily without having to edit HTML or JavaScript code directly. All the main content displayed on the website is read from JSON data files.

## How to Modify the Data

To update the website, you simply need to edit the respective JSON file located in the `data/` directory. 

Here is a breakdown of the data files and what they control:

*   `data/home.json`
    Contains the welcome text, general description, and the main research directions listed on the home page.
*   `data/people.json`
    Contains information about all team members, including faculty, researchers, PhD students, alumni, etc. You can edit names, roles, biographies, links, and profile picture references here.
*   `data/projects.json`
    Stores the details of research projects. Modify this file to add new projects, update project statuses, or change their descriptions.
*   `data/publications.json`
    Contains the entire list of academic publications (papers, journals, conferences) produced by the group. Add new publication entries here as they are published. NOTE: this file is automatically populated via a script that fetches data from Google Scholar; please avoid modifying it unless you know what you are doing.
*   `data/research.json`
    Contains information about the specific research areas and topics.


## How to Test the Website Locally

 ```bash
python3 -m http.server 8000
```
