# DBlockbuster-Electron-App
This is a Electron Application Which utilizes Sqlite db to store paths of your movies when you drag and drop them into it and serves them publicly over a /video and /videoplayer endpoint with a randomly generated subdomain from try.cloudflare.com also connects to DBlockbuster's gateway server so it can build a database of what you are providing


# The videoplayer endpoint has request query parameters as such!
- ?tmdbId={id} This is the movie or tv show id that tmdb created for it!
- &type={movie|tv} is it a movie or tv show your looking to play!
- &quality={hd|cam|sd} what quality you want!
- &fileIndex={number} what index starting from 0 if providing more then one file for this movie or tv show this will be how you get that file!
- &season={number} if its tv show you can specify season
- &episode={number} if its tv show you can specify episode to look for to play!

# The video endpointHas the same request query parameters
- but you need to request this endpoint with headers that include range basically use this endpoint for if you have a website that has a video element in it then you would set its src to this video endpoint using the proper query parameters for that specific film!



This utilizes a custom made version of cloudflared node module to be compatabile with electron applications!

The original cloudflared node module that was modified can be found here!
https://github.com/JacobLinCool/node-cloudflared
