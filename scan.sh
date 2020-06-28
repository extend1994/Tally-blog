all=0
for a in $(ls source/_drafts); do
  unit=$(grep -n "staticflickr" "source/_drafts/$a" | wc -l)
  echo $a": "$unit
  all=$(($unit+$all))
done
echo $all

all=0
for a in $(ls source/_posts); do
  unit=$(grep -n "staticflickr" "source/_posts/$a" | wc -l)
  echo $a": "$unit
  all=$(($unit+$all))
done
echo $all
