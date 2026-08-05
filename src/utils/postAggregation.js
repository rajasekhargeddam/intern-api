const buildPostAggregation = ({
  matchStage = {},
  userId,
  limit = 10,
  offset = 0,
  includePagination = true,
}) => {
  const pipeline = [];

  if (matchStage && Object.keys(matchStage).length > 0) {
    pipeline.push({
      $match: matchStage,
    });
  }

  pipeline.push({
    $sort: {
      createdAt: -1,
    },
  });

  if (includePagination) {
    pipeline.push(
      {
        $skip: offset,
      },
      {
        $limit: limit + 1,
      },
    );
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              username: 1,
              profilePicture: 1,
              role: 1,
            },
          },
        ],
        as: "author",
      },
    },
    {
      $unwind: "$author",
    },
    {
      $lookup: {
        from: "likes",
        let: {
          postId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$post", "$$postId"],
              },
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
              users: {
                $push: "$user",
              },
            },
          },
        ],
        as: "likesData",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: {
          postId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$post", "$$postId"],
              },
            },
          },
          {
            $count: "count",
          },
        ],
        as: "commentsData",
      },
    },
    {
      $addFields: {
        likesCount: {
          $ifNull: [
            {
              $first: "$likesData.count",
            },
            0,
          ],
        },
        commentsCount: {
          $ifNull: [
            {
              $first: "$commentsData.count",
            },
            0,
          ],
        },
        isLiked: {
          $in: [
            userId,
            {
              $ifNull: [
                {
                  $first: "$likesData.users",
                },
                [],
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        likesData: 0,
        commentsData: 0,
      },
    },
  );

  return pipeline;
};

const buildPaginationMeta = (posts, limit, offset) => {
  const hasMore = posts.length > limit;

  if (hasMore) {
    posts.pop();
  }

  return {
    posts,
    hasMore,
    nextOffset: offset + posts.length,
  };
};

module.exports = {
  buildPostAggregation,
  buildPaginationMeta,
};
