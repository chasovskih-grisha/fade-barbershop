import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchArticleFeed, type ArticleSummaryDto } from '../../../lib/api/articles';
import { formatArticleDate } from '../../../lib/blog/article-view';
import { styles } from '../../index.styles';

type FeedState = 'loading' | 'ready' | 'error';

export default function BlogFeedScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleSummaryDto[]>([]);
  const [state, setState] = useState<FeedState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState('loading');
    fetchArticleFeed()
      .then((list) => {
        if (!mounted) return;
        setArticles(list);
        setState('ready');
      })
      .catch(() => {
        if (mounted) setState('error');
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);

  if (state === 'loading') {
    return (
      <View style={styles.content}>
        <Text testID="blog-loading" style={styles.cardMuted}>
          Завантаження...
        </Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero}>Не вдалося завантажити блог</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.cta}
          onPress={() => setAttempt((value) => value + 1)}
        >
          <Text style={styles.ctaLabel} testID="blog-retry">
            Спробувати ще раз
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.hero} testID="blog-title">
        Блог
      </Text>
      {articles.length === 0 ? (
        <Text style={styles.cardMuted} testID="blog-empty">
          Статей поки немає
        </Text>
      ) : (
        articles.map((article) => (
          <Pressable
            key={article.id}
            accessibilityRole="button"
            style={styles.card}
            testID={`blog-card-${article.slug}`}
            onPress={() => router.push(`/(client)/blog/${article.slug}`)}
          >
            {article.coverUrl ? (
              <Image
                source={{ uri: article.coverUrl }}
                accessibilityLabel={article.title}
                style={styles.blogCover}
              />
            ) : null}
            <Text style={styles.cardTitle}>{article.title}</Text>
            {article.excerpt ? <Text style={styles.cardMuted}>{article.excerpt}</Text> : null}
            <Text style={styles.cardLabel}>{formatArticleDate(article.publishedAt)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
