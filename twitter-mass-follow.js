var LANGUAGE = "TR"; //NOTE: change it to use your language! NOT: kullanmadan önce dili değiştirin!
var WORDS =
{
	//English language:
	//İngilizce:
	EN:
	{
		followsYouText: "Follows you", //Text that informs that follows you.
		followingButtonText: "Follow", //Text of the "Following" button.

	},
    //Turkish language:
	//Türkçe:
	TR:
    {
        followsYouText: "Seni takip ediyor", //Sizi takip ettiğini bildiren metin.
        followingButtonText: "Takip et", //"Takip Ediliyor" düğmesinin metni.

    }
}
var FOLLOW_FOLLOWERS = false; //True olarak ayarlanırsa, kimseyi takip etmez.
var MS_PER_CYCLE = 100;//Döngü başına milisaniye (her 'PerformFollow' çağrısı).
var MAXIMUM_FOLLOW_ACTIONS_PER_CYCLE = 20;//Döngü başına gerçekleştirilecek maksimum takip eylemi (her 'Takip Etme' çağrısı). Sınır olmaması için 'boş' olarak ayarlayın.
var MAXIMUM_FOLLOW_ACTIONS_TOTAL = 20; //Maximum of follow actions to perform, in total (among all calls to 'performFollow'). Set to 'null' to have no limit.
//Toplamda gerçekleştirilecek maksimum takip eylemi (tüm 'Takip Et' çağrıları arasında). Sınır olmaması için 'boş' olarak ayarlayın.

var SKIP_USERS = //Users that we do not want to follow (even if they are not following you back):
//Takip etmek istemediğimiz kullanıcılar (sizi geri takip etmeseler bile):
[
	//Place the user names that you want to skip here (they will not be unfollowed):
	//Atlamak istediğiniz kullanıcı adlarını buraya yerleştirin (takipten çıkarılmayacaktır):
	
	
];

//Büyük/küçük harfe duyarlı olmayacağı için tüm kullanıcı adlarını küçük harfe dönüştürür.
SKIP_USERS.forEach(function(value, index) { SKIP_USERS[index] = value.toLowerCase(); }); //Transforms all the user names to lower case as it will be case insensitive.

// Gerçekleştirilen toplam takibi bırakma eylemlerinin sayısını tutar. Salt okunur (değiştirmeyin).
var FOLLOWED_TOTAL = 0; //Keeps the number of total unfollow actions performed. Read-only (do not modify).

//Function that follows non-followers on Twitter:
//Twitter'da takipçi olmayanları takip eden işlev:
var performFollow = function(followsYouText, followingButtonText, FollowFollowers, maximumFollowActionsPerCycle, maximumFollowActionsTotal)
{
	var followed = 0;
	followsYouText = followsYouText || WORDS.EN.followsYouText; //Text that informs that follows you.//Sizin takip ettiğinizi bildiren metin.
	followingButtonText = followingButtonText || WORDS.EN.followingButtonText; //Text of the "Follow" button.//"Takip et" butonunun metni.
	FollowFollowers = typeof(FollowFollowers) === "undefined" || FollowFollowers === null ? FOLLOW_FOLLOWERS : FollowFollowers;
	maximumFollowActionsTotal = maximumFollowActionsTotal === null || !isNaN(parseInt(maximumFollowActionsTotal)) ? maximumFollowActionsTotal : MAXIMUM_FOLLOW_ACTIONS_TOTAL || null;
	maximumFollowActionsTotal = !isNaN(parseInt(maximumFollowActionsTotal)) ? parseInt(maximumFollowActionsTotal) : null;
	maximumFollowActionsPerCycle = maximumFollowActionsPerCycle === null || !isNaN(parseInt(maximumFollowActionsPerCycle)) ? maximumFollowActionsPerCycle : MAXIMUM_FOLLOW_ACTIONS_PER_CYCLE || null;
	maximumFollowActionsPerCycle = !isNaN(parseInt(maximumFollowActionsPerCycle)) ? parseInt(maximumFollowActionsPerCycle) : null;

	//Looks through all the containers of each user:
	//Her kullanıcının tüm kapsayıcılarına bakar:
	var totalLimitReached = false;
	var localLimitReached = false;
	var userContainers = document.querySelectorAll('[data-testid=UserCell]');
	Array.prototype.filter.call
	(
		userContainers,
		function(userContainer)
		{
			//If we have reached a limit previously, exits silently:
			//Daha önce bir limite ulaştıysak sessizce çıkar:
			if (totalLimitReached || localLimitReached) { return; }
			//If we have reached the maximum desired number of total follow actions, exits:
			//İstediğimiz maksimum toplam takip eylemi sayısına ulaştıysak, çıkar:
			else if (maximumFollowActionsTotal !== null && FOLLOWED_TOTAL >= maximumFollowActionsTotal) { console.log("Exiting! Limit of follow actions in total reached: " + maximumFollowActionsTotal); totalLimitReached = true; return;  }
			//...otherwise, if we have reached the maximum desired number of local follow actions, exits:
			//...aksi takdirde, istenen maksimum yerel takip eylemi sayısına ulaştıysak, çıkar:
			else if (maximumFollowActionsPerCycle !== null && followed >= maximumFollowActionsPerCycle) { console.log("Exiting! Limit of follow actions per cycle reached: " + maximumFollowActionsPerCycle); localLimitReached = true; return;  }

			//Checks whether the user is following you:
			//Kullanıcının sizi takip edip etmediğini kontrol eder:
			if (!FollowFollowers)
			{
				var followsYou = false;

				Array.from(userContainer.querySelectorAll("*")).find
				(
					function(element)
					{
						if (element.textContent === followsYouText) { followsYou = true; }
					}
				);
			}
			else { followsYou = true; 
			
			//Finds the user name and checks whether we want to skip this user or not:
				//Kullanıcı adını bulur ve bu kullanıcıyı atlamak isteyip istemediğimizi kontrol eder:
				var skipUser = false;
				var userName = "";
				Array.from(userContainer.querySelectorAll("[href^='/']")).find
				(
					function (element)
					{
						if (skipUser) { return; }
						if (element.href.indexOf("search?q=") !== -1 || element.href.indexOf("/") === -1) { return; }
						userName = element.href.substring(element.href.lastIndexOf("/") + 1).toLowerCase();
						Array.from(element.querySelectorAll("*")).find
						(
							function (subElement)
							{
								if (subElement.textContent.toLowerCase() === "@" + userName)
								{
									if (SKIP_USERS.indexOf(userName) !== -1)
									{
										console.log("We want to skip: " + userName);
										skipUser = true;
									}
								}
							}
						);
					}
				);
			
			}

		
			if (!followsYou)
			{
				//Finds the user name and checks whether we want to skip this user or not:
				//Kullanıcı adını bulur ve bu kullanıcıyı atlamak isteyip istemediğimizi kontrol eder:
				var skipUser = false;
				var userName = "";
				Array.from(userContainer.querySelectorAll("[href^='/']")).find
				(
					function (element)
					{
						if (skipUser) { return; }
						if (element.href.indexOf("search?q=") !== -1 || element.href.indexOf("/") === -1) { return; }
						userName = element.href.substring(element.href.lastIndexOf("/") + 1).toLowerCase();
						Array.from(element.querySelectorAll("*")).find
						(
							function (subElement)
							{
								if (subElement.textContent.toLowerCase() === "@" + userName)
								{
									if (SKIP_USERS.indexOf(userName) !== -1)
									{
										console.log("We want to skip: " + userName);
										skipUser = true;
									}
								}
							}
						);
					}
				);

				//If we do not want to skip the user:
				//Kullanıcıyı atlamak istemiyorsak:
				if (!skipUser)
				{
					//Finds the unfollow button:
					//Takip et düğmesini bulur:
					Array.from(userContainer.querySelectorAll('[role=button]')).find
					(
						function(element)
						{
							//If the unfollow button is found, clicks it:
							//Takip et düğmesi bulunursa, tıklar:
							if (element.textContent === followingButtonText)
							{
								console.log("* Following: " + userName);
								element.click();
								followed++;
								FOLLOWED_TOTAL++;
							}
						}
					);
				}
			}
		}
	);


	//Toplam sınıra ulaşılmışsa, null değerini döndürür. Aksi takdirde, takip edilmeyen kişilerin sayısını döndürür.
	return totalLimitReached ? null : followed; //If the total limit has been reached, returns null. Otherwise, returns the number of unfollowed people.
}


//Scrolls and follows non-followers, constantly:
//Takip etmeyenleri sürekli olarak kaydırır ve takip eder:
var scrollAndFollow = function()
{
	window.scrollTo(0, document.body.scrollHeight);
	var followed = performFollow(WORDS[LANGUAGE].followsYouText, WORDS[LANGUAGE].followingButtonText, FOLLOW_FOLLOWERS, MAXIMUM_FOLLOW_ACTIONS_PER_CYCLE, MAXIMUM_FOLLOW_ACTIONS_TOTAL); //For English, you can try to call it without parameters.
	if (followed !== null) { setTimeout(scrollAndFollow, MS_PER_CYCLE); }
	else { console.log("Total desired of follow actions performed!"); }
};
scrollAndFollow();