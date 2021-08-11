# kryanina
GEOG 575 Final Projeeeeeeeeeect

# On the indicators
You can find indicators and their subsequent year with the following:
    `INDICATOR ABBREVIATON` + `YEAR`

The translation of the democracy indicators:
| Dem. Index        | Abbreviation  |
| -----------       | -----------   |
| Electoral         | el            |
| Liberal           | li            |
| Participatory     | pa            |
| Deliberative      | de            |
| Egalitarian       | eg            |

So, the liberal democracy index for 2020 would be:  
      `li2020`

# Useful Git Stuff

Download the VSCode extension "GitHub Pull Requests and Issues". This will 
allow us to create and view issues from GitHub, and it will also allow us to 
create "topic branches" based off of these issues.

Adding a commit
```
git add .
git commit -m "your commit message"
git push origin develop
```

Merging changes from branch into develop
```
git checkout yourTopicBranch
git pull // make sure you are up to date
git checkout develop
git merge yourTopicBranch
```
