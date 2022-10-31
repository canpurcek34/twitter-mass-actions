var LANGUAGE = "TR"; //NOTE: change it to use your language! NOT: kullanmadan önce dili değiştirin!
var WORDS =
{
	//English language:
	//İngilizce:
	EN:
	{
		followsYouText: "Follows you", //Text that informs that follows you.
		followingButtonText: "Following", //Text of the "Following" button.
		confirmationButtonText: "Unfollow" //Text of the confirmation button. I am not totally sure.
	},
    //Turkish language:
	//Türkçe:
	TR:
    {
        followsYouText: "Seni takip ediyor", //Sizi takip ettiğini bildiren metin.
        followingButtonText: "Takip ediliyor", //"Takip Ediliyor" düğmesinin metni.
        confirmationButtonText: "Takibi bırak" //Onay düğmesinin metni.
    }
}
var UNFOLLOW_FOLLOWERS = false; //If set to true, it will also remove followers (unless they are skipped).
//True olarak ayarlanırsa, takipçileri de kaldıracaktır (atlanmadıkları sürece).
var MS_PER_CYCLE = 10; //Milliseconds per cycle (each call to 'performUnfollow').
//Döngü başına milisaniye (her 'PerformUnfollow' çağrısı).
var MAXIMUM_UNFOLLOW_ACTIONS_PER_CYCLE = null; //Maximum of unfollow actions to perform, per cycle (each call to 'performUnfollow'). Set to 'null' to have no limit.
//Döngü başına gerçekleştirilecek maksimum takibi bırakma eylemi (her 'Takip Etme' çağrısı). Sınır olmaması için 'boş' olarak ayarlayın.
var MAXIMUM_UNFOLLOW_ACTIONS_TOTAL = null; //Maximum of unfollow actions to perform, in total (among all calls to 'performUnfollow'). Set to 'null' to have no limit.
//Toplamda gerçekleştirilecek maksimum takibi bırakma eylemi (tüm 'Takip Etme' çağrıları arasında). Sınır olmaması için 'boş' olarak ayarlayın.
var SKIP_USERS = //Users that we do not want to unfollow (even if they are not following you back):
//Takibi bırakmak istemediğimiz kullanıcılar (sizi geri takip etmeseler bile):
[
	//Place the user names that you want to skip here (they will not be unfollowed):
	//Atlamak istediğiniz kullanıcı adlarını buraya yerleştirin (takipten çıkarılmayacaktır):
	"tedmosbygibii"
];

//Büyük/küçük harfe duyarlı olmayacağı için tüm kullanıcı adlarını küçük harfe dönüştürür.
SKIP_USERS.forEach(function(value, index) { SKIP_USERS[index] = value.toLowerCase(); }); //Transforms all the user names to lower case as it will be case insensitive.

// Gerçekleştirilen toplam takibi bırakma eylemlerinin sayısını tutar. Salt okunur (değiştirmeyin).
var _UNFOLLOWED_TOTAL = 0; //Keeps the number of total unfollow actions performed. Read-only (do not modify).

//Function that unfollows non-followers on Twitter:
//Twitter'da takipçi olmayanları takip etmeyi bırakan işlev:
var performUnfollow = function(followsYouText, followingButtonText, confirmationButtonText, unfollowFollowers, maximumUnfollowActionsPerCycle, maximumUnfollowActionsTotal)
{
	var unfollowed = 0;
	followsYouText = followsYouText || WORDS.EN.followsYouText; //Text that informs that follows you.//Sizi takip ettiğinizi bildiren metin.
	followingButtonText = followingButtonText || WORDS.EN.followingButtonText; //Text of the "Following" button.//"Takip ediliyor" butonunun metni.
	confirmationButtonText = confirmationButtonText || WORDS.EN.confirmationButtonText; //Text of the confirmation button.//Onay butonunun metni.
	unfollowFollowers = typeof(unfollowFollowers) === "undefined" || unfollowFollowers === null ? UNFOLLOW_FOLLOWERS : unfollowFollowers;
	maximumUnfollowActionsTotal = maximumUnfollowActionsTotal === null || !isNaN(parseInt(maximumUnfollowActionsTotal)) ? maximumUnfollowActionsTotal : MAXIMUM_UNFOLLOW_ACTIONS_TOTAL || null;
	maximumUnfollowActionsTotal = !isNaN(parseInt(maximumUnfollowActionsTotal)) ? parseInt(maximumUnfollowActionsTotal) : null;
	maximumUnfollowActionsPerCycle = maximumUnfollowActionsPerCycle === null || !isNaN(parseInt(maximumUnfollowActionsPerCycle)) ? maximumUnfollowActionsPerCycle : MAXIMUM_UNFOLLOW_ACTIONS_PER_CYCLE || null;
	maximumUnfollowActionsPerCycle = !isNaN(parseInt(maximumUnfollowActionsPerCycle)) ? parseInt(maximumUnfollowActionsPerCycle) : null;

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
			//If we have reached the maximum desired number of total unfollow actions, exits:
			//İstediğimiz maksimum toplam takibi bırakma eylemi sayısına ulaştıysak, çıkar:
			else if (maximumUnfollowActionsTotal !== null && _UNFOLLOWED_TOTAL >= maximumUnfollowActionsTotal) { console.log("Exiting! Limit of unfollow actions in total reached: " + maximumUnfollowActionsTotal); totalLimitReached = true; return;  }
			//...otherwise, if we have reached the maximum desired number of local unfollow actions, exits:
			//...aksi takdirde, istenen maksimum yerel takipten çıkarma eylemi sayısına ulaştıysak, çıkar:
			else if (maximumUnfollowActionsPerCycle !== null && unfollowed >= maximumUnfollowActionsPerCycle) { console.log("Exiting! Limit of unfollow actions per cycle reached: " + maximumUnfollowActionsPerCycle); localLimitReached = true; return;  }

			//Checks whether the user is following you:
			//Kullanıcının sizi takip edip etmediğini kontrol eder:
			if (!unfollowFollowers)
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
			else { followsYou = false; } //If we want to also unfollow followers, we consider it is not a follower.//Takipçileri de takibi bırakmak istiyorsak, onun takipçi olmadığını düşünüyoruz.

			//If the user is not following you (or we also want to unfollow followers):
			//Kullanıcı sizi takip etmiyorsa (veya biz de takipçileri takibi bırakmak istiyorsak):
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
					//Takip etmeyi bırak düğmesini bulur:
					Array.from(userContainer.querySelectorAll('[role=button]')).find
					(
						function(element)
						{
							//If the unfollow button is found, clicks it:
							//Takip etmeyi bırak düğmesi bulunursa, tıklar:
							if (element.textContent === followingButtonText)
							{
								console.log("* Unfollowing: " + userName);
								element.click();
								unfollowed++;
								_UNFOLLOWED_TOTAL++;
							}
						}
					);
				}
			}
		}
	);

	//If there is a confirmation dialog, press it automatically:
	//Bir onay iletişim kutusu varsa, otomatik olarak basın:
	Array.from(document.querySelectorAll('[role=button]')).find //Finds the confirmation button.//Onay butonunu bulur.
	(
		function(element)
		{
			//If the confirmation button is found, clicks it:
			//Onay butonu bulunursa, tıklanır:
			if (element.textContent === confirmationButtonText)
			{
				element.click();
			}
		}
	);

	//Toplam sınıra ulaşılmışsa, null değerini döndürür. Aksi takdirde, takip edilmeyen kişilerin sayısını döndürür.
	return totalLimitReached ? null : unfollowed; //If the total limit has been reached, returns null. Otherwise, returns the number of unfollowed people.
}


//Scrolls and unfollows non-followers, constantly:
//Takip etmeyenleri sürekli olarak kaydırır ve takibi bırakır:
var scrollAndUnfollow = function()
{
	window.scrollTo(0, document.body.scrollHeight);
	var unfollowed = performUnfollow(WORDS[LANGUAGE].followsYouText, WORDS[LANGUAGE].followingButtonText, WORDS[LANGUAGE].confirmationButtonText, UNFOLLOW_FOLLOWERS, MAXIMUM_UNFOLLOW_ACTIONS_PER_CYCLE, MAXIMUM_UNFOLLOW_ACTIONS_TOTAL); //For English, you can try to call it without parameters.
	if (unfollowed !== null) { setTimeout(scrollAndUnfollow, MS_PER_CYCLE); }
	else { console.log("Total desired of unfollow actions performed!"); }
};
scrollAndUnfollow();